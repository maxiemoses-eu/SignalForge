package main
import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
	"github.com/maxiemoses-eu/signalforge/payment/internal/config"
	"github.com/maxiemoses-eu/signalforge/payment/internal/handler"
	"github.com/maxiemoses-eu/signalforge/payment/internal/provider/paystack"
	"github.com/maxiemoses-eu/signalforge/payment/internal/service"
	"github.com/maxiemoses-eu/signalforge/payment/internal/store"
)
func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	cfg, err := config.Load()
	if err!= nil {
		logger.Error("config load failed", "error", err)
		os.Exit(1)
	}
	memStore := store.NewMemoryStore()
	idemStore := store.NewIdempotencyStore()
	psProvider := paystack.New(cfg.PaystackSecret, cfg.PaystackBaseURL)
	svc := service.New(psProvider, memStore, idemStore)
	h := handler.New(svc, psProvider, logger)
	mux := http.NewServeMux()
	h.Register(mux)
	srv := &http.Server{Addr: ":" + cfg.Port, Handler: mux, ReadTimeout: 10*time.Second, WriteTimeout: 10*time.Second, IdleTimeout: 60*time.Second}
	go func() {
		logger.Info("starting", "port", cfg.Port)
		_ = srv.ListenAndServe()
	}()
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
}
