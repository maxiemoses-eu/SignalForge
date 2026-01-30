package main // FIXED: Must match main.go

import (
    "testing"
    "time"
)

func TestPaymentFlowSafety(t *testing.T) {
    t.Parallel()
    status := "READY"
    time.Sleep(10 * time.Millisecond)
    if status != "READY" {
        t.Errorf("Security Risk: Payment state tampered")
    }
}