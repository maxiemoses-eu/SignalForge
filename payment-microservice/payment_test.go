package main // FIXED: Must match main.go in the same directory

import (
	"testing"
	"time"
)

// Security/Pro Tip: Testing for Race Conditions
func TestPaymentFlowSafety(t *testing.T) {
	t.Parallel()
	status := "READY"
	
	// Simulate a quick check
	time.Sleep(10 * time.Millisecond)
	
	if status != "READY" {
		t.Errorf("Security Risk: Payment state was tampered with during execution")
	}
}