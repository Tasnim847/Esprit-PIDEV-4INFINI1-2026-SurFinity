package org.example.projet_pi.Service;

import org.example.projet_pi.Dto.ComplaintSearchDTO;
import org.example.projet_pi.entity.Complaint;
import org.example.projet_pi.Repository.ComplaintRepository;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ComplaintService implements IComplaintService {

    private final ComplaintRepository complaintRepository;

    public ComplaintService(ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    // ---------------- CRUD ----------------

    @Override
    public Complaint addComplaint(Complaint complaint) {
        return complaintRepository.save(complaint);
    }

    @Override
    public Complaint updateComplaint(Complaint complaint) {
        // Vérifie que la réclamation existe avant mise à jour
        Complaint existing = complaintRepository.findById(complaint.getId())
                .orElseThrow(() -> new RuntimeException("Complaint not found"));
        existing.setStatus(complaint.getStatus());
        existing.setMessage(complaint.getMessage());
        existing.setClaimDate(complaint.getClaimDate());
        existing.setResolutionDate(complaint.getResolutionDate());
        existing.setAgentAssurance(complaint.getAgentAssurance());
        existing.setAgentFinance(complaint.getAgentFinance());
        existing.setClient(complaint.getClient());
        return complaintRepository.save(existing);
    }

    @Override
    public void deleteComplaint(Long id) {
        complaintRepository.deleteById(id);
    }

    @Override
    public Complaint getComplaintById(Long id) {
        return complaintRepository.findById(id).orElse(null);
    }

    @Override
    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    // ---------------- Recherche avancée ----------------

    @Override
    public List<Complaint> searchComplaints(ComplaintSearchDTO dto) {
        return complaintRepository.searchComplaints(
                dto.getStatus(),
                dto.getKeyword(),
                dto.getClientId(),
                dto.getAgentAssuranceId(),
                dto.getAgentFinanceId(),
                dto.getDateDebut(),
                dto.getDateFin()
        );
    }

    // ---------------- KPI ----------------

    // 1️⃣ Temps moyen de traitement (en jours)
    @Override
    public double calculateAverageProcessingTime() {
        List<Complaint> closed = complaintRepository.findByStatus("CLOSED");
        if (closed.isEmpty()) return 0;

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

        return count == 0 ? 0 : totalDays / (double) count;
    }

    // 2️⃣ Taux de résolution
    @Override
    public double resolutionRate() {
        long total = complaintRepository.count();
        if (total == 0) return 0;

        long resolved = complaintRepository.countByStatus("APPROVED");
        return (resolved * 100.0) / total;
    }

    // 3️⃣ Taux de rejet
    @Override
    public double rejectionRate() {
        long total = complaintRepository.count();
        if (total == 0) return 0;

        long rejected = complaintRepository.countByStatus("REJECTED");
        return (rejected * 100.0) / total;
    }

    // 4️⃣ Agent le plus performant
    @Override
    public String findTopAgent() {
        List<Complaint> complaints = complaintRepository.findAll();
        Map<String, Long> agentCount = new HashMap<>();

        for (Complaint c : complaints) {
            if (c.getAgentAssurance() != null) {
                String name = c.getAgentAssurance().getFirstName()+ " (Assurance)";
                agentCount.put(name, agentCount.getOrDefault(name, 0L) + 1);
            }
            if (c.getAgentFinance() != null) {
                String name = c.getAgentFinance().getFirstName() + " (Finance)";
                agentCount.put(name, agentCount.getOrDefault(name, 0L) + 1);
            }
        }

        return agentCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("No Agent");
    }

    // 5️⃣ Dashboard KPI complet
    @Override
    public Map<String, Object> getDashboardKpi() {
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("averageProcessingTime", calculateAverageProcessingTime());
        dashboard.put("resolutionRate", resolutionRate());
        dashboard.put("rejectionRate", rejectionRate());
        dashboard.put("topAgent", findTopAgent());
        return dashboard;
    }
}