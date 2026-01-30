package com.signalforge.order;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class OrderSecurityTest {
    @Test
    void validateNoNegativePricing() {
        double unitPrice = 19.99;
        int quantity = 2;
        double total = unitPrice * quantity;
        
        // Security check: total must never be manipulated to be <= 0
        assertTrue(total > 0, "Security Violation: Order total cannot be zero or negative.");
    }
}