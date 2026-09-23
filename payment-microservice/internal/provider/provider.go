package provider
import "github.com/maxiemoses-eu/signalforge/payment/internal/model"
type InitRequest struct{Email string; AmountKobo int64; Reference string}
type InitResponse struct{AuthURL, Reference string}
type VerifyResponse struct{Status model.Status; Reference string; Amount int64; Email string}
type Provider interface{Name() string; Initialize(req InitRequest)(InitResponse, error); Verify(ref string)(VerifyResponse, error); VerifyWebhookSignature(p []byte, sig string)bool}
