package org.example.projet_pi.Controller;

import lombok.RequiredArgsConstructor;
import org.example.projet_pi.Service.CashPaymentRequestService;
import org.example.projet_pi.entity.CashPaymentRequest;
import org.example.projet_pi.entity.Payment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cash-requests")
@RequiredArgsConstructor
public class CashPaymentRequestController {

    private final CashPaymentRequestService cashPaymentRequestService;

    @PostMapping("/request")
    public ResponseEntity<CashPaymentRequest> requestCashPayment(
            @RequestBody CashPaymentRequest request) {
        return ResponseEntity.ok(cashPaymentRequestService.createRequest(request));
    }

    @GetMapping("/pending/{agentId}")
    public ResponseEntity<List<CashPaymentRequest>> getPendingRequests(@PathVariable Long agentId) {
        List<CashPaymentRequest> requests = cashPaymentRequestService.getPendingRequestsByAgent(agentId);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<CashPaymentRequest>> getClientRequests(@PathVariable Long clientId) {
        return ResponseEntity.ok(cashPaymentRequestService.getRequestsByClient(clientId));
    }

    @GetMapping("/payment/{paymentId}")
    public ResponseEntity<List<CashPaymentRequest>> getRequestsByPaymentId(@PathVariable Long paymentId) {
        return ResponseEntity.ok(cashPaymentRequestService.getRequestsByPaymentId(paymentId));
    }

    @PostMapping("/{requestId}/approve")
    public ResponseEntity<Payment> approveRequest(@PathVariable Long requestId) {
        Payment payment = cashPaymentRequestService.approveRequest(requestId);
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/{requestId}/reject")
    public ResponseEntity<CashPaymentRequest> rejectRequest(
            @PathVariable Long requestId,
            @RequestBody String reason) {
        return ResponseEntity.ok(cashPaymentRequestService.rejectRequest(requestId, reason));
    }
}