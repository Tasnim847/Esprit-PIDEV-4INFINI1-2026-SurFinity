package org.example.projet_pi.Controller;

import org.example.projet_pi.Dto.AccountRequestDTO;
import org.example.projet_pi.Dto.CreateAccountRequestDTO;
import org.example.projet_pi.Service.AccountRequestService;
import org.example.projet_pi.entity.Account;
import org.example.projet_pi.security.CustomUserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/account-requests")
public class AccountRequestController {

    private final AccountRequestService accountRequestService;

    public AccountRequestController(AccountRequestService accountRequestService) {
        this.accountRequestService = accountRequestService;
    }

    // 🔹 CLIENT : Créer une demande de compte
    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<?> createRequest(@RequestBody CreateAccountRequestDTO request,
                                           Authentication auth) {
        Long clientId = getCurrentClientId(auth);
        System.out.println("Creating request for client ID: " + clientId);
        return ResponseEntity.ok(accountRequestService.createRequest(clientId, request.getType()));
    }

    // 🔹 CLIENT : Voir ses demandes
    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<List<AccountRequestDTO>> getMyRequests(Authentication auth) {
        Long clientId = getCurrentClientId(auth);
        return ResponseEntity.ok(accountRequestService.getClientRequests(clientId));
    }

    // 🔹 AGENT_FINANCE : Voir toutes les demandes en attente
    @GetMapping("/pending")
    @PreAuthorize("hasRole('AGENT_FINANCE')")
    public ResponseEntity<List<AccountRequestDTO>> getPendingRequests() {
        return ResponseEntity.ok(accountRequestService.getPendingRequests());
    }

    // 🔹 AGENT_FINANCE : Approuver une demande
    @PutMapping("/{requestId}/approve")
    @PreAuthorize("hasRole('AGENT_FINANCE')")
    public ResponseEntity<Account> approveRequest(@PathVariable Long requestId,
                                                  Authentication auth) {
        Long agentId = getCurrentAgentId(auth);
        return ResponseEntity.ok(accountRequestService.approveRequest(requestId, agentId));
    }

    // 🔹 AGENT_FINANCE : Rejeter une demande
    @PutMapping("/{requestId}/reject")
    @PreAuthorize("hasRole('AGENT_FINANCE')")
    public ResponseEntity<?> rejectRequest(@PathVariable Long requestId,
                                           @RequestParam String reason,
                                           Authentication auth) {
        Long agentId = getCurrentAgentId(auth);
        accountRequestService.rejectRequest(requestId, agentId, reason);
        return ResponseEntity.ok("Demande rejetée");
    }

    // ✅ CORRECTION : Récupérer l'ID du client depuis CustomUserPrincipal
    private Long getCurrentClientId(Authentication auth) {
        CustomUserPrincipal principal = (CustomUserPrincipal) auth.getPrincipal();
        return principal.getId();  // Utilisez getId() au lieu de caster en Client
    }

    // ✅ CORRECTION : Récupérer l'ID de l'agent depuis CustomUserPrincipal
    private Long getCurrentAgentId(Authentication auth) {
        CustomUserPrincipal principal = (CustomUserPrincipal) auth.getPrincipal();
        return principal.getId();
    }
}