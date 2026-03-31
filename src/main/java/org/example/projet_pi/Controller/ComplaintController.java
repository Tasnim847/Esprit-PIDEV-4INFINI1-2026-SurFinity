package org.example.projet_pi.Controller;

import org.example.projet_pi.Dto.ComplaintSearchDTO;
import org.example.projet_pi.Service.SmsService;
import org.example.projet_pi.entity.Complaint;
import org.example.projet_pi.entity.User;
import org.example.projet_pi.entity.Role;
import org.example.projet_pi.Repository.ComplaintRepository;
import org.example.projet_pi.Repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/complaints")
public class ComplaintController {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final SmsService smsService;

    public ComplaintController(ComplaintRepository complaintRepository, UserRepository userRepository ,
                               SmsService smsService) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.smsService = smsService;
    }

    // ========== CRUD ==========

    /**
     * AJOUTER une réclamation
     * POST /complaints/addComplaint
     */
    @PostMapping("/addComplaint")
    @Transactional
    public ResponseEntity<?> addComplaint(@RequestBody Complaint complaint) {
        try {
            validateAndLoadUsers(complaint);

            if (complaint.getClaimDate() == null) {
                complaint.setClaimDate(new Date());
            }

            if (complaint.getStatus() == null || complaint.getStatus().isEmpty()) {
                complaint.setStatus("PENDING");
            }

            Complaint saved = complaintRepository.save(complaint);

            // ✅ SMS ICI
            if (saved.getPhone() != null) {
                smsService.sendSms(
                        saved.getPhone(),
                        "Votre réclamation est bien envoyée. Elle sera traitée."
                );
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Réclamation ajoutée avec succès");
            response.put("complaint", saved);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error", "Erreur lors de l'ajout de la réclamation",
                            "message", e.getMessage()
                    ));
        }
    }

    /**
     * MODIFIER une réclamation
     * PUT /complaints/updateComplaint/{id}
     */
    @PutMapping("/updateComplaint/{id}")
    @Transactional
    public ResponseEntity<?> updateComplaint(@PathVariable Long id, @RequestBody Complaint complaintDetails) {
        try {
            // Vérifier si la réclamation existe
            Complaint existingComplaint = complaintRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Réclamation non trouvée avec l'id: " + id));

            // Mise à jour des champs
            if (complaintDetails.getStatus() != null) {
                existingComplaint.setStatus(complaintDetails.getStatus());
            }

            if (complaintDetails.getMessage() != null) {
                existingComplaint.setMessage(complaintDetails.getMessage());
            }

            if (complaintDetails.getClaimDate() != null) {
                existingComplaint.setClaimDate(complaintDetails.getClaimDate());
            }

            if (complaintDetails.getResolutionDate() != null) {
                existingComplaint.setResolutionDate(complaintDetails.getResolutionDate());
            }

            // Mise à jour des agents (avec validation)
            if (complaintDetails.getAgentAssurance() != null) {
                // Créer une nouvelle complaint temporaire pour la validation
                Complaint tempComplaint = new Complaint();
                tempComplaint.setAgentAssurance(complaintDetails.getAgentAssurance());
                tempComplaint.setClient(existingComplaint.getClient()); // Garder le client existant
                validateAndLoadUsers(tempComplaint);
                existingComplaint.setAgentAssurance(tempComplaint.getAgentAssurance());
            }

            if (complaintDetails.getAgentFinance() != null) {
                Complaint tempComplaint = new Complaint();
                tempComplaint.setAgentFinance(complaintDetails.getAgentFinance());
                tempComplaint.setClient(existingComplaint.getClient());
                validateAndLoadUsers(tempComplaint);
                existingComplaint.setAgentFinance(tempComplaint.getAgentFinance());
            }

            // Mise à jour du client (avec validation)
            if (complaintDetails.getClient() != null) {
                Complaint tempComplaint = new Complaint();
                tempComplaint.setClient(complaintDetails.getClient());
                validateAndLoadUsers(tempComplaint);
                existingComplaint.setClient(tempComplaint.getClient());
            }

            Complaint updatedComplaint = complaintRepository.save(existingComplaint);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Réclamation modifiée avec succès");
            response.put("complaint", updatedComplaint);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error", "Erreur lors de la modification de la réclamation",
                            "message", e.getMessage()
                    ));
        }
    }

    /**
     * SUPPRIMER une réclamation
     * DELETE /complaints/deleteComplaint/{id}
     */
    @DeleteMapping("/deleteComplaint/{id}")
    @Transactional
    public ResponseEntity<?> deleteComplaint(@PathVariable Long id) {
        try {
            // Vérifier si la réclamation existe
            Complaint complaint = complaintRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Réclamation non trouvée avec l'id: " + id));

            // Supprimer la réclamation
            complaintRepository.delete(complaint);

            return ResponseEntity.ok(Map.of(
                    "message", "Réclamation supprimée avec succès",
                    "id", id,
                    "deletedComplaint", complaint
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error", "Erreur lors de la suppression de la réclamation",
                            "message", e.getMessage()
                    ));
        }
    }

    /**
     * RÉCUPÉRER une réclamation par ID
     * GET /complaints/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getComplaintById(@PathVariable Long id) {
        try {
            Complaint complaint = complaintRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Réclamation non trouvée avec l'id: " + id));
            return ResponseEntity.ok(complaint);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * RÉCUPÉRER toutes les réclamations
     * GET /complaints/all
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllComplaints() {
        try {
            List<Complaint> complaints = complaintRepository.findAll();

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Liste des réclamations récupérée avec succès");
            response.put("count", complaints.size());
            response.put("complaints", complaints);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ========== RECHERCHE ==========

    @PostMapping("/search")
    public ResponseEntity<?> searchComplaints(@RequestBody ComplaintSearchDTO dto) {
        try {
            List<Complaint> results = complaintRepository.searchComplaints(
                    dto.getStatus(),
                    dto.getKeyword(),
                    dto.getClientId(),
                    dto.getAgentAssuranceId(),
                    dto.getAgentFinanceId(),
                    dto.getDateDebut(),
                    dto.getDateFin()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Recherche effectuée avec succès");
            response.put("count", results.size());
            response.put("results", results);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ========== KPI ==========

    @GetMapping("/kpi/average-processing-time")
    public ResponseEntity<?> calculateAverageProcessingTime() {
        try {
            List<Complaint> closed = complaintRepository.findByStatus("CLOSED");
            if (closed.isEmpty()) return ResponseEntity.ok(0.0);

            long totalDays = 0;
            int count = 0;

            for (Complaint c : closed) {
                if (c.getClaimDate() != null && c.getResolutionDate() != null) {
                    long days = ChronoUnit.DAYS.between(
                            c.getClaimDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate(),
                            c.getResolutionDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate()
                    );
                    totalDays += days;
                    count++;
                }
            }

            double average = count == 0 ? 0 : (double) totalDays / count;

            Map<String, Object> response = new HashMap<>();
            response.put("averageProcessingTime", average);
            response.put("unit", "days");
            response.put("complaintsCount", count);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/kpi/resolution-rate")
    public ResponseEntity<?> resolutionRate() {
        try {
            long total = complaintRepository.count();
            if (total == 0) return ResponseEntity.ok(0.0);

            long resolved = complaintRepository.countByStatus("APPROVED");
            double rate = (resolved * 100.0) / total;

            Map<String, Object> response = new HashMap<>();
            response.put("resolutionRate", rate);
            response.put("resolvedCount", resolved);
            response.put("totalCount", total);
            response.put("unit", "percentage");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/kpi/rejection-rate")
    public ResponseEntity<?> rejectionRate() {
        try {
            long total = complaintRepository.count();
            if (total == 0) return ResponseEntity.ok(0.0);

            long rejected = complaintRepository.countByStatus("REJECTED");
            double rate = (rejected * 100.0) / total;

            Map<String, Object> response = new HashMap<>();
            response.put("rejectionRate", rate);
            response.put("rejectedCount", rejected);
            response.put("totalCount", total);
            response.put("unit", "percentage");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/kpi/top-agent")
    public ResponseEntity<?> findTopAgent() {
        try {
            List<Complaint> complaints = complaintRepository.findAll();
            Map<String, Long> agentCount = new HashMap<>();

            for (Complaint c : complaints) {
                if (c.getAgentAssurance() != null) {
                    User agent = c.getAgentAssurance();
                    String fullName = agent.getFirstName() + " " + agent.getLastName() + " (Assurance)";
                    agentCount.put(fullName, agentCount.getOrDefault(fullName, 0L) + 1);
                }
                if (c.getAgentFinance() != null) {
                    User agent = c.getAgentFinance();
                    String fullName = agent.getFirstName() + " " + agent.getLastName() + " (Finance)";
                    agentCount.put(fullName, agentCount.getOrDefault(fullName, 0L) + 1);
                }
            }

            String topAgent = agentCount.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("Aucun agent");

            Long maxCount = agentCount.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getValue)
                    .orElse(0L);

            Map<String, Object> result = new HashMap<>();
            result.put("topAgent", topAgent);
            result.put("numberOfComplaints", maxCount);
            result.put("allAgents", agentCount);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/kpi/dashboard")
    public ResponseEntity<?> getDashboardKpi() {
        try {
            Map<String, Object> dashboard = new HashMap<>();

            // Récupérer tous les KPI
            dashboard.put("averageProcessingTime", calculateAverageProcessingTime().getBody());
            dashboard.put("resolutionRate", resolutionRate().getBody());
            dashboard.put("rejectionRate", rejectionRate().getBody());
            dashboard.put("topAgent", findTopAgent().getBody());

            // Statistiques supplémentaires
            long total = complaintRepository.count();
            long pending = complaintRepository.countByStatus("PENDING");
            long inProgress = complaintRepository.countByStatus("IN_PROGRESS");
            long approved = complaintRepository.countByStatus("APPROVED");
            long rejected = complaintRepository.countByStatus("REJECTED");
            long closed = complaintRepository.countByStatus("CLOSED");

            Map<String, Object> stats = new HashMap<>();
            stats.put("total", total);
            stats.put("pending", pending);
            stats.put("inProgress", inProgress);
            stats.put("approved", approved);
            stats.put("rejected", rejected);
            stats.put("closed", closed);

            dashboard.put("statistics", stats);
            dashboard.put("message", "Tableau de bord KPI généré avec succès");

            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ========== MÉTHODE DE VALIDATION ==========

    private void validateAndLoadUsers(Complaint complaint) {
        // Client (obligatoire)
        if (complaint.getClient() != null) {
            if (complaint.getClient().getId() != null) {
                Optional<User> existingClient = userRepository.findById(complaint.getClient().getId());
                if (existingClient.isPresent()) {
                    complaint.setClient(existingClient.get());
                } else {
                    User newClient = complaint.getClient();
                    newClient.setId(null);
                    newClient.setEmail(newClient.getEmail() != null ? newClient.getEmail() : "client_" + System.currentTimeMillis() + "@test.com");
                    newClient.setRole(Role.CLIENT);
                    if (newClient.getPassword() == null) {
                        newClient.setPassword("$2a$10$dummyhash");
                    }
                    if (newClient.getFirstName() == null) {
                        newClient.setFirstName("Client");
                    }
                    if (newClient.getLastName() == null) {
                        newClient.setLastName("Test");
                    }
                    complaint.setClient(userRepository.save(newClient));
                }
            } else {
                User newClient = complaint.getClient();
                newClient.setId(null);
                newClient.setRole(Role.CLIENT);
                if (newClient.getEmail() == null) {
                    newClient.setEmail("client_" + System.currentTimeMillis() + "@test.com");
                }
                if (newClient.getPassword() == null) {
                    newClient.setPassword("$2a$10$dummyhash");
                }
                if (newClient.getFirstName() == null) {
                    newClient.setFirstName("Client");
                }
                if (newClient.getLastName() == null) {
                    newClient.setLastName("Test");
                }
                complaint.setClient(userRepository.save(newClient));
            }
        } else {
            throw new RuntimeException("Le client est obligatoire");
        }

        // Agent Assurance (optionnel)
        if (complaint.getAgentAssurance() != null) {
            if (complaint.getAgentAssurance().getId() != null) {
                Optional<User> existingAgent = userRepository.findById(complaint.getAgentAssurance().getId());
                if (existingAgent.isPresent()) {
                    complaint.setAgentAssurance(existingAgent.get());
                } else {
                    User newAgent = complaint.getAgentAssurance();
                    newAgent.setId(null);
                    newAgent.setEmail(newAgent.getEmail() != null ? newAgent.getEmail() : "agent.assurance_" + System.currentTimeMillis() + "@test.com");
                    newAgent.setRole(Role.AGENT_ASSURANCE);
                    if (newAgent.getPassword() == null) {
                        newAgent.setPassword("$2a$10$dummyhash");
                    }
                    if (newAgent.getFirstName() == null) {
                        newAgent.setFirstName("Agent");
                    }
                    if (newAgent.getLastName() == null) {
                        newAgent.setLastName("Assurance");
                    }
                    complaint.setAgentAssurance(userRepository.save(newAgent));
                }
            } else {
                User newAgent = complaint.getAgentAssurance();
                newAgent.setId(null);
                newAgent.setRole(Role.AGENT_ASSURANCE);
                if (newAgent.getEmail() == null) {
                    newAgent.setEmail("agent_assurance_" + System.currentTimeMillis() + "@test.com");
                }
                if (newAgent.getPassword() == null) {
                    newAgent.setPassword("$2a$10$dummyhash");
                }
                if (newAgent.getFirstName() == null) {
                    newAgent.setFirstName("Agent");
                }
                if (newAgent.getLastName() == null) {
                    newAgent.setLastName("Assurance");
                }
                complaint.setAgentAssurance(userRepository.save(newAgent));
            }
        }

        // Agent Finance (optionnel)
        if (complaint.getAgentFinance() != null) {
            if (complaint.getAgentFinance().getId() != null) {
                Optional<User> existingAgent = userRepository.findById(complaint.getAgentFinance().getId());
                if (existingAgent.isPresent()) {
                    complaint.setAgentFinance(existingAgent.get());
                } else {
                    User newAgent = complaint.getAgentFinance();
                    newAgent.setId(null);
                    newAgent.setEmail(newAgent.getEmail() != null ? newAgent.getEmail() : "agent.finance_" + System.currentTimeMillis() + "@test.com");
                    newAgent.setRole(Role.AGENT_FINANCE);
                    if (newAgent.getPassword() == null) {
                        newAgent.setPassword("$2a$10$dummyhash");
                    }
                    if (newAgent.getFirstName() == null) {
                        newAgent.setFirstName("Agent");
                    }
                    if (newAgent.getLastName() == null) {
                        newAgent.setLastName("Finance");
                    }
                    complaint.setAgentFinance(userRepository.save(newAgent));
                }
            } else {
                User newAgent = complaint.getAgentFinance();
                newAgent.setId(null);
                newAgent.setRole(Role.AGENT_FINANCE);
                if (newAgent.getEmail() == null) {
                    newAgent.setEmail("agent_finance_" + System.currentTimeMillis() + "@test.com");
                }
                if (newAgent.getPassword() == null) {
                    newAgent.setPassword("$2a$10$dummyhash");
                }
                if (newAgent.getFirstName() == null) {
                    newAgent.setFirstName("Agent");
                }
                if (newAgent.getLastName() == null) {
                    newAgent.setLastName("Finance");
                }
                complaint.setAgentFinance(userRepository.save(newAgent));
            }
        }
    }
}