package org.example.projet_pi.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "cash_payment_requests")
public class CashPaymentRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long paymentId;
    private Long contractId;
    private Long clientId;
    private Long agentId;
    private Double amount;
    private String clientName;
    private String clientEmail;

    @Enumerated(EnumType.STRING)
    private RequestStatus status = RequestStatus.PENDING;

    private String rejectionReason;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {
        requestedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        processedAt = LocalDateTime.now();
    }
}