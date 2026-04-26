package org.example.projet_pi.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.projet_pi.Repository.CashPaymentRequestRepository;
import org.example.projet_pi.Repository.InsuranceContractRepository;
import org.example.projet_pi.Repository.PaymentRepository;
import org.example.projet_pi.entity.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CashPaymentRequestService {

    private final CashPaymentRequestRepository requestRepository;
    private final PaymentRepository paymentRepository;
    private final InsuranceContractRepository contractRepository;
    private final PaymentService paymentService;
    // ❌ Supprimez cette ligne si elle existe
    // private final WebSocketController webSocketController;

    @Transactional
    public CashPaymentRequest createRequest(CashPaymentRequest request) {
        // Vérifier si une demande existe déjà pour ce paiement
        List<CashPaymentRequest> existingRequests = requestRepository.findByPaymentId(request.getPaymentId());

        for (CashPaymentRequest existing : existingRequests) {
            if (existing.getStatus() == RequestStatus.PENDING) {
                throw new RuntimeException("Une demande est déjà en attente pour ce paiement");
            }
        }

        request.setStatus(RequestStatus.PENDING);
        request.setRequestedAt(LocalDateTime.now());

        CashPaymentRequest savedRequest = requestRepository.save(request);

        log.info("📝 Nouvelle demande de paiement CASH créée: {} DT pour le client {}",
                request.getAmount(), request.getClientName());

        return savedRequest;
    }

    public List<CashPaymentRequest> getPendingRequestsByAgent(Long agentId) {
        return requestRepository.findByAgentIdAndStatus(agentId, RequestStatus.PENDING);
    }

    public List<CashPaymentRequest> getRequestsByClient(Long clientId) {
        return requestRepository.findByClientId(clientId);
    }

    public List<CashPaymentRequest> getRequestsByPaymentId(Long paymentId) {
        return requestRepository.findByPaymentId(paymentId);
    }

    @Transactional
    public Payment approveRequest(Long requestId) {
        CashPaymentRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Cette demande a déjà été traitée");
        }

        // Récupérer le paiement
        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé"));

        // Vérifier que le paiement est toujours PENDING
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new RuntimeException("Ce paiement a déjà été effectué");
        }

        // Récupérer le contrat
        InsuranceContract contract = contractRepository.findById(request.getContractId())
                .orElseThrow(() -> new RuntimeException("Contrat non trouvé"));

        // Marquer le paiement comme PAYÉ
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaymentMethod(PaymentMethod.CASH);
        payment.setPaymentDate(new java.util.Date());
        paymentRepository.save(payment);

        // Mettre à jour le contrat
        contract.setTotalPaid(contract.getTotalPaid() + payment.getAmount());
        contract.setRemainingAmount(contract.getRemainingAmount() - payment.getAmount());

        if (contract.getRemainingAmount() <= 0.01) {
            contract.setStatus(ContractStatus.COMPLETED);
            contract.setRemainingAmount(0.0);
        }
        contractRepository.save(contract);

        // Mettre à jour la demande
        request.setStatus(RequestStatus.APPROVED);
        request.setProcessedAt(LocalDateTime.now());
        requestRepository.save(request);

        log.info("✅ Demande de paiement CASH approuvée: {} DT - Contrat {}",
                payment.getAmount(), request.getContractId());

        return payment;
    }

    @Transactional
    public CashPaymentRequest rejectRequest(Long requestId, String reason) {
        CashPaymentRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Cette demande a déjà été traitée");
        }

        request.setStatus(RequestStatus.REJECTED);
        request.setRejectionReason(reason);
        request.setProcessedAt(LocalDateTime.now());

        log.info("❌ Demande de paiement CASH refusée: {} - Raison: {}",
                requestId, reason);

        // Note: Le paiement reste en status PENDING pour que le client puisse le reselectionner

        return requestRepository.save(request);
    }
}