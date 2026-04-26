package org.example.projet_pi.Repository;

import org.example.projet_pi.entity.CashPaymentRequest;
import org.example.projet_pi.entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CashPaymentRequestRepository extends JpaRepository<CashPaymentRequest, Long> {

    List<CashPaymentRequest> findByAgentIdAndStatus(Long agentId, RequestStatus status);

    List<CashPaymentRequest> findByClientId(Long clientId);

    List<CashPaymentRequest> findByStatus(RequestStatus status);

    List<CashPaymentRequest> findByPaymentId(Long paymentId);
}