import os

files = {
"go.mod": "module github.com/maxiemoses-eu/signalforge/payment\n\ngo 1.22.0\n",
".dockerignore": ".git\n.github\nbin/\ndist/\ntmp/\n*.test\n*.out\n.idea/\n.vscode/\n.env\n",
"Dockerfile": """# syntax=docker/dockerfile:1.6
FROM golang:1.22.8-alpine AS build
WORKDIR /src
RUN apk add --no-cache ca-certificates git
COPY go.mod go.sum./
RUN go mod download
COPY..
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/payment./cmd/payment
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build --chown=nonroot:nonroot /out/payment /payment
COPY --from=build --chown=nonroot:nonroot /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
USER nonroot:nonroot
EXPOSE 5003
ENTRYPOINT ["/payment"]
""",
"cmd/payment/main.go": """package main
import (
\t"context"
\t"log/slog"
\t"net/http"
\t"os"
\t"os/signal"
\t"syscall"
\t"time"
\t"github.com/maxiemoses-eu/signalforge/payment/internal/config"
\t"github.com/maxiemoses-eu/signalforge/payment/internal/handler"
\t"github.com/maxiemoses-eu/signalforge/payment/internal/provider/paystack"
\t"github.com/maxiemoses-eu/signalforge/payment/internal/service"
\t"github.com/maxiemoses-eu/signalforge/payment/internal/store"
)
func main() {
\tlogger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
\tcfg, err := config.Load()
\tif err!= nil {
\t\tlogger.Error("config load failed", "error", err)
\t\tos.Exit(1)
\t}
\tmemStore := store.NewMemoryStore()
\tidemStore := store.NewIdempotencyStore()
\tpsProvider := paystack.New(cfg.PaystackSecret, cfg.PaystackBaseURL)
\tsvc := service.New(psProvider, memStore, idemStore)
\th := handler.New(svc, psProvider, logger)
\tmux := http.NewServeMux()
\th.Register(mux)
\tsrv := &http.Server{Addr: ":" + cfg.Port, Handler: mux, ReadTimeout: 10*time.Second, WriteTimeout: 10*time.Second, IdleTimeout: 60*time.Second}
\tgo func() {
\t\tlogger.Info("starting", "port", cfg.Port)
\t\t_ = srv.ListenAndServe()
\t}()
\tquit := make(chan os.Signal, 1)
\tsignal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
\t<-quit
\tctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
\tdefer cancel()
\t_ = srv.Shutdown(ctx)
}
""",
"internal/config/config.go": """package config
import ("errors"; "os")
const defaultPort = "5003"
const defaultURL = "https://api.paystack.co"
type Config struct{Port, PaystackSecret, PaystackBaseURL string}
func Load() (Config, error){
\tport:=os.Getenv("PORT")
\tif port==""{port=defaultPort}
\tsecret:=os.Getenv("PAYSTACK_SECRET_KEY")
\tif secret==""{return Config{}, errors.New("PAYSTACK_SECRET_KEY required")}
\tbase:=os.Getenv("PAYSTACK_BASE_URL")
\tif base==""{base=defaultURL}
\treturn Config{Port:port, PaystackSecret:secret, PaystackBaseURL:base}, nil
}
""",
"internal/model/payment.go": """package model
import "time"
type Status string
const(StatusPending Status="pending"; StatusSuccess Status="success"; StatusFailed Status="failed")
type Payment struct{Reference string; Email string; AmountKobo int64; Status Status; Provider string; AuthURL string; CreatedAt time.Time}
""",
"internal/provider/provider.go": """package provider
import "github.com/maxiemoses-eu/signalforge/payment/internal/model"
type InitRequest struct{Email string; AmountKobo int64; Reference string}
type InitResponse struct{AuthURL, Reference string}
type VerifyResponse struct{Status model.Status; Reference string; Amount int64; Email string}
type Provider interface{Name() string; Initialize(req InitRequest)(InitResponse, error); Verify(ref string)(VerifyResponse, error); VerifyWebhookSignature(p []byte, sig string)bool}
""",
"internal/provider/paystack/paystack.go": """package paystack
import (
\t"bytes"; "context"; "crypto/hmac"; "crypto/sha512"; "encoding/hex"; "encoding/json"; "fmt"; "io"; "net/http"; "time";
\t"github.com/maxiemoses-eu/signalforge/payment/internal/model"; "github.com/maxiemoses-eu/signalforge/payment/internal/provider"
)
type Client struct{secret, base string; http *http.Client}
func New(s,b string)*Client{return &Client{secret:s, base:b, http:&http.Client{Timeout:15*time.Second}}}
func (c *Client)Name()string{return"paystack"}
func (c *Client)Initialize(req provider.InitRequest)(provider.InitResponse,error){
\tb,_:=json.Marshal(map[string]any{"email":req.Email,"amount":req.AmountKobo,"reference":req.Reference})
\tctx,cancel:=context.WithTimeout(context.Background(),15*time.Second); defer cancel()
\thr,_:=http.NewRequestWithContext(ctx,"POST",c.base+"/transaction/initialize",bytes.NewReader(b))
\thr.Header.Set("Authorization","Bearer "+c.secret); hr.Header.Set("Content-Type","application/json")
\tresp,err:=c.http.Do(hr); if err!=nil{return provider.InitResponse{},err}
\tdefer resp.Body.Close()
\tif resp.StatusCode!=200{raw,_:=io.ReadAll(resp.Body); return provider.InitResponse{}, fmt.Errorf("status %d %s",resp.StatusCode,string(raw))}
\tvar out struct{Status bool; Message string; Data struct{AuthorizationURL string `json:\"authorization_url\"`; Reference string `json:\"reference\"`}}
\t_ = json.NewDecoder(resp.Body).Decode(&out)
\treturn provider.InitResponse{AuthURL:out.Data.AuthorizationURL, Reference:out.Data.Reference},nil
}
func (c *Client)Verify(ref string)(provider.VerifyResponse,error){
\tctx,cancel:=context.WithTimeout(context.Background(),15*time.Second); defer cancel()
\treq,_:=http.NewRequestWithContext(ctx,"GET",c.base+"/transaction/verify/"+ref,nil)
\treq.Header.Set("Authorization","Bearer "+c.secret)
\tresp,err:=c.http.Do(req); if err!=nil{return provider.VerifyResponse{},err}
\tdefer resp.Body.Close()
\tvar out struct{Data struct{Status, Reference string; Amount int64; Customer struct{Email string}}}
\t_ = json.NewDecoder(resp.Body).Decode(&out)
\tst:=model.StatusFailed; if out.Data.Status=="success"{st=model.StatusSuccess}
\treturn provider.VerifyResponse{Status:st, Reference:out.Data.Reference, Amount:out.Data.Amount, Email:out.Data.Customer.Email},nil
}
func (c *Client)VerifyWebhookSignature(p []byte, sig string)bool{
\tif len(p)==0||sig==""{return false}
\tmac:=hmac.New(sha512.New, []byte(c.secret)); _,_=mac.Write(p)
\texp:=hex.EncodeToString(mac.Sum(nil)); return hmac.Equal([]byte(exp), []byte(sig))
}
""",
"internal/store/memory.go": """package store
import ("sync"; "github.com/maxiemoses-eu/signalforge/payment/internal/model")
type MemoryStore struct{mu sync.RWMutex; data map[string]*model.Payment}
func NewMemoryStore()*MemoryStore{return &MemoryStore{data:map[string]*model.Payment{}}}
func (s *MemoryStore)Save(p *model.Payment){s.mu.Lock(); s.data[p.Reference]=p; s.mu.Unlock()}
func (s *MemoryStore)Get(ref string)(*model.Payment,bool){s.mu.RLock(); p,ok:=s.data[ref]; s.mu.RUnlock(); return p,ok}
""",
"internal/store/idempotency.go": """package store
import ("sync"; "time")
type IdempotencyStore struct{mu sync.RWMutex; seen map[string]time.Time}
func NewIdempotencyStore()*IdempotencyStore{return &IdempotencyStore{seen:map[string]time.Time{}}}
func (s *IdempotencyStore)IsProcessed(k string)bool{s.mu.RLock(); _,ok:=s.seen[k]; s.mu.RUnlock(); return ok}
func (s *IdempotencyStore)MarkProcessed(k string){s.mu.Lock(); s.seen[k]=time.Now().UTC(); s.mu.Unlock()}
""",
"internal/service/service.go": """package service
import ("errors"; "fmt"; "net/mail"; "time"; "github.com/maxiemoses-eu/signalforge/payment/internal/model"; "github.com/maxiemoses-eu/signalforge/payment/internal/provider"; "github.com/maxiemoses-eu/signalforge/payment/internal/store")
type Service struct{provider provider.Provider; store *store.MemoryStore; idem *store.IdempotencyStore}
func New(p provider.Provider, s *store.MemoryStore, i *store.IdempotencyStore)*Service{return &Service{provider:p, store:s, idem:i}}
func (s *Service)CreateIntent(email string, kobo int64, meta map[string]any)(*model.Payment,error){
\tif _,err:=mail.ParseAddress(email);err!=nil{return nil, errors.New("invalid email")}
\tif kobo<10000{return nil, errors.New("amount too small")}
\tref:=fmt.Sprintf("sf_%d",time.Now().UnixNano())
\tres,err:=s.provider.Initialize(provider.InitRequest{Email:email, AmountKobo:kobo, Reference:ref})
\tif err!=nil{return nil, err}
\tp:=&model.Payment{Reference:res.Reference, Email:email, AmountKobo:kobo, Status:model.StatusPending, Provider:s.provider.Name(), AuthURL:res.AuthURL, CreatedAt:time.Now().UTC()}
\ts.store.Save(p); return p,nil
}
func (s *Service)Verify(ref string)(*model.Payment,error){
\tif ref==""{return nil, errors.New("reference required")}
\tv,err:=s.provider.Verify(ref); if err!=nil{return nil, err}
\tp,_:=s.store.Get(ref)
\tif p==nil{p=&model.Payment{Reference:v.Reference, Email:v.Email, AmountKobo:v.Amount, CreatedAt:time.Now().UTC()}}
\tp.Status=v.Status; s.store.Save(p); return p,nil
}
func (s *Service)IsWebhookProcessed(id string)bool{return s.idem.IsProcessed(id)}
func (s *Service)MarkWebhookProcessed(id string){s.idem.MarkProcessed(id)}
""",
"internal/handler/middleware.go": """package handler
import "net/http"
func securityHeaders(next http.Handler)http.Handler{
\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request){
\t\tw.Header().Set("X-Content-Type-Options","nosniff"); w.Header().Set("X-Frame-Options","DENY")
\t\tnext.ServeHTTP(w,r)
\t})
}
""",
"internal/handler/handler.go": """package handler
import ("encoding/json"; "io"; "log/slog"; "net/http"; "strings"; "github.com/maxiemoses-eu/signalforge/payment/internal/provider"; "github.com/maxiemoses-eu/signalforge/payment/internal/service")
const maxBody = 1<<20
type Handler struct{svc *service.Service; provider provider.Provider; logger *slog.Logger}
func New(svc *service.Service, p provider.Provider, l *slog.Logger)*Handler{return &Handler{svc:svc, provider:p, logger:l}}
func (h *Handler)Register(mux *http.ServeMux){
\tmux.Handle("/health", securityHeaders(http.HandlerFunc(h.health)))
\tmux.Handle("/v1/payments/initialize", securityHeaders(http.HandlerFunc(h.initialize)))
\tmux.Handle("/v1/payments/verify/", securityHeaders(http.HandlerFunc(h.verify)))
\tmux.Handle("/v1/webhooks/paystack", securityHeaders(http.HandlerFunc(h.webhook)))
}
func (h *Handler)health(w http.ResponseWriter, r *http.Request){w.Header().Set("Content-Type","application/json"); _,_=w.Write([]byte(`{"status":"ok"}`))}
func (h *Handler)initialize(w http.ResponseWriter, r *http.Request){
\tr.Body=http.MaxBytesReader(w,r.Body,maxBody)
\tvar req struct{Email string `json:"email"`; AmountKobo int64 `json:"amount_kobo"`}
\tif err:=json.NewDecoder(r.Body).Decode(&req);err!=nil{http.Error(w,"invalid json",400);return}
\tp,err:=h.svc.CreateIntent(req.Email,req.AmountKobo,nil)
\tif err!=nil{http.Error(w,err.Error(),400);return}
\tw.Header().Set("Content-Type","application/json"); w.WriteHeader(201); _ = json.NewEncoder(w).Encode(p)
}
func (h *Handler)verify(w http.ResponseWriter, r *http.Request){
\tref:=strings.TrimPrefix(r.URL.Path,"/v1/payments/verify/")
\tif ref==""{http.Error(w,"reference required",400);return}
\tp,err:=h.svc.Verify(ref); if err!=nil{http.Error(w,err.Error(),400);return}
\tw.Header().Set("Content-Type","application/json"); _ = json.NewEncoder(w).Encode(p)
}
func (h *Handler)webhook(w http.ResponseWriter, r *http.Request){
\tr.Body=http.MaxBytesReader(w,r.Body,maxBody)
\tbody,err:=io.ReadAll(r.Body); if err!=nil{http.Error(w,"too large",413);return}
\tsig:=r.Header.Get("x-paystack-signature")
\tif!h.provider.VerifyWebhookSignature(body,sig){http.Error(w,"invalid sig",401);return}
\tvar evt struct{ID string `json:"id"`; Data struct{Reference string `json:"reference"`} `json:"data"`}
\t_ = json.Unmarshal(body,&evt)
\tif h.svc.IsWebhookProcessed(evt.ID){w.WriteHeader(200); return}
\t_,_=h.svc.Verify(evt.Data.Reference)
\th.svc.MarkWebhookProcessed(evt.ID)
\tw.WriteHeader(200)
}
""",
}

for p,c in files.items():
    d=os.path.dirname(p)
    if d:
        os.makedirs(d, exist_ok=True)
    with open(p,"w") as f:
        f.write(c)
    print(f"✅ {p}")
