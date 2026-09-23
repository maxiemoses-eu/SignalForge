package config
import ("errors"; "os")
const defaultPort = "5003"
const defaultURL = "https://api.paystack.co"
type Config struct{Port, PaystackSecret, PaystackBaseURL string}
func Load() (Config, error){
	port:=os.Getenv("PORT")
	if port==""{port=defaultPort}
	secret:=os.Getenv("PAYSTACK_SECRET_KEY")
	if secret==""{return Config{}, errors.New("PAYSTACK_SECRET_KEY required")}
	base:=os.Getenv("PAYSTACK_BASE_URL")
	if base==""{base=defaultURL}
	return Config{Port:port, PaystackSecret:secret, PaystackBaseURL:base}, nil
}
