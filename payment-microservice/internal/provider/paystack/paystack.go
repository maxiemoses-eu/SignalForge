package paystack
import (
	"bytes"; "context"; "crypto/hmac"; "crypto/sha512"; "encoding/hex"; "encoding/json"; "fmt"; "io"; "net/http"; "time";
	"github.com/maxiemoses-eu/signalforge/payment/internal/model"; "github.com/maxiemoses-eu/signalforge/payment/internal/provider"
)
type Client struct{secret, base string; http *http.Client}
func New(s,b string)*Client{return &Client{secret:s, base:b, http:&http.Client{Timeout:15*time.Second}}}
func (c *Client)Name()string{return"paystack"}
func (c *Client)Initialize(req provider.InitRequest)(provider.InitResponse,error){
	b,_:=json.Marshal(map[string]any{"email":req.Email,"amount":req.AmountKobo,"reference":req.Reference})
	ctx,cancel:=context.WithTimeout(context.Background(),15*time.Second); defer cancel()
	hr,_:=http.NewRequestWithContext(ctx,"POST",c.base+"/transaction/initialize",bytes.NewReader(b))
	hr.Header.Set("Authorization","Bearer "+c.secret); hr.Header.Set("Content-Type","application/json")
	resp,err:=c.http.Do(hr); if err!=nil{return provider.InitResponse{},err}
	defer resp.Body.Close()
	if resp.StatusCode!=200{raw,_:=io.ReadAll(resp.Body); return provider.InitResponse{}, fmt.Errorf("status %d %s",resp.StatusCode,string(raw))}
	var out struct{Status bool; Message string; Data struct{AuthorizationURL string `json:"authorization_url"`; Reference string `json:"reference"`}}
	_ = json.NewDecoder(resp.Body).Decode(&out)
	return provider.InitResponse{AuthURL:out.Data.AuthorizationURL, Reference:out.Data.Reference},nil
}
func (c *Client)Verify(ref string)(provider.VerifyResponse,error){
	ctx,cancel:=context.WithTimeout(context.Background(),15*time.Second); defer cancel()
	req,_:=http.NewRequestWithContext(ctx,"GET",c.base+"/transaction/verify/"+ref,nil)
	req.Header.Set("Authorization","Bearer "+c.secret)
	resp,err:=c.http.Do(req); if err!=nil{return provider.VerifyResponse{},err}
	defer resp.Body.Close()
	var out struct{Data struct{Status, Reference string; Amount int64; Customer struct{Email string}}}
	_ = json.NewDecoder(resp.Body).Decode(&out)
	st:=model.StatusFailed; if out.Data.Status=="success"{st=model.StatusSuccess}
	return provider.VerifyResponse{Status:st, Reference:out.Data.Reference, Amount:out.Data.Amount, Email:out.Data.Customer.Email},nil
}
func (c *Client)VerifyWebhookSignature(p []byte, sig string)bool{
	if len(p)==0||sig==""{return false}
	mac:=hmac.New(sha512.New, []byte(c.secret)); _,_=mac.Write(p)
	exp:=hex.EncodeToString(mac.Sum(nil)); return hmac.Equal([]byte(exp), []byte(sig))
}
