package handler
import ("encoding/json"; "io"; "log/slog"; "net/http"; "strings"; "github.com/maxiemoses-eu/signalforge/payment/internal/provider"; "github.com/maxiemoses-eu/signalforge/payment/internal/service")
const maxBody = 1<<20
type Handler struct{svc *service.Service; provider provider.Provider; logger *slog.Logger}
func New(svc *service.Service, p provider.Provider, l *slog.Logger)*Handler{return &Handler{svc:svc, provider:p, logger:l}}
func (h *Handler)Register(mux *http.ServeMux){
	mux.Handle("/health", securityHeaders(http.HandlerFunc(h.health)))
	mux.Handle("/v1/payments/initialize", securityHeaders(http.HandlerFunc(h.initialize)))
	mux.Handle("/v1/payments/verify/", securityHeaders(http.HandlerFunc(h.verify)))
	mux.Handle("/v1/webhooks/paystack", securityHeaders(http.HandlerFunc(h.webhook)))
}
func (h *Handler)health(w http.ResponseWriter, r *http.Request){w.Header().Set("Content-Type","application/json"); _,_=w.Write([]byte(`{"status":"ok"}`))}
func (h *Handler)initialize(w http.ResponseWriter, r *http.Request){
	r.Body=http.MaxBytesReader(w,r.Body,maxBody)
	var req struct{Email string `json:"email"`; AmountKobo int64 `json:"amount_kobo"`}
	if err:=json.NewDecoder(r.Body).Decode(&req);err!=nil{http.Error(w,"invalid json",400);return}
	p,err:=h.svc.CreateIntent(req.Email,req.AmountKobo,nil)
	if err!=nil{http.Error(w,err.Error(),400);return}
	w.Header().Set("Content-Type","application/json"); w.WriteHeader(201); _ = json.NewEncoder(w).Encode(p)
}
func (h *Handler)verify(w http.ResponseWriter, r *http.Request){
	ref:=strings.TrimPrefix(r.URL.Path,"/v1/payments/verify/")
	if ref==""{http.Error(w,"reference required",400);return}
	p,err:=h.svc.Verify(ref); if err!=nil{http.Error(w,err.Error(),400);return}
	w.Header().Set("Content-Type","application/json"); _ = json.NewEncoder(w).Encode(p)
}
func (h *Handler)webhook(w http.ResponseWriter, r *http.Request){
	r.Body=http.MaxBytesReader(w,r.Body,maxBody)
	body,err:=io.ReadAll(r.Body); if err!=nil{http.Error(w,"too large",413);return}
	sig:=r.Header.Get("x-paystack-signature")
	if!h.provider.VerifyWebhookSignature(body,sig){http.Error(w,"invalid sig",401);return}
	var evt struct{ID string `json:"id"`; Data struct{Reference string `json:"reference"`} `json:"data"`}
	_ = json.Unmarshal(body,&evt)
	if h.svc.IsWebhookProcessed(evt.ID){w.WriteHeader(200); return}
	_,_=h.svc.Verify(evt.Data.Reference)
	h.svc.MarkWebhookProcessed(evt.ID)
	w.WriteHeader(200)
}
