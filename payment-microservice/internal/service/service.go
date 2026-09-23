package service
import ("errors"; "fmt"; "net/mail"; "time"; "github.com/maxiemoses-eu/signalforge/payment/internal/model"; "github.com/maxiemoses-eu/signalforge/payment/internal/provider"; "github.com/maxiemoses-eu/signalforge/payment/internal/store")
type Service struct{provider provider.Provider; store *store.MemoryStore; idem *store.IdempotencyStore}
func New(p provider.Provider, s *store.MemoryStore, i *store.IdempotencyStore)*Service{return &Service{provider:p, store:s, idem:i}}
func (s *Service)CreateIntent(email string, kobo int64, meta map[string]any)(*model.Payment,error){
	if _,err:=mail.ParseAddress(email);err!=nil{return nil, errors.New("invalid email")}
	if kobo<10000{return nil, errors.New("amount too small")}
	ref:=fmt.Sprintf("sf_%d",time.Now().UnixNano())
	res,err:=s.provider.Initialize(provider.InitRequest{Email:email, AmountKobo:kobo, Reference:ref})
	if err!=nil{return nil, err}
	p:=&model.Payment{Reference:res.Reference, Email:email, AmountKobo:kobo, Status:model.StatusPending, Provider:s.provider.Name(), AuthURL:res.AuthURL, CreatedAt:time.Now().UTC()}
	s.store.Save(p); return p,nil
}
func (s *Service)Verify(ref string)(*model.Payment,error){
	if ref==""{return nil, errors.New("reference required")}
	v,err:=s.provider.Verify(ref); if err!=nil{return nil, err}
	p,_:=s.store.Get(ref)
	if p==nil{p=&model.Payment{Reference:v.Reference, Email:v.Email, AmountKobo:v.Amount, CreatedAt:time.Now().UTC()}}
	p.Status=v.Status; s.store.Save(p); return p,nil
}
func (s *Service)IsWebhookProcessed(id string)bool{return s.idem.IsProcessed(id)}
func (s *Service)MarkWebhookProcessed(id string){s.idem.MarkProcessed(id)}
