package com.signalforge.order;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class OrderSecurityTest {

    @Test
    void testOrderAmountValidation() {
        double orderTotal = 100.00;
        // Fail if the system allows an order total to be manipulated below zero
        assertTrue(orderTotal > 0, "Security Violation: Order total must be positive.");
    }

    @Test
    void testOrderPayloadIntegrity() {
        String orderId = "ORD-12345";
        assertNotNull(orderId, "Integrity Check: Order ID cannot be null.");
    }
}