package org.example.projet_pi.Service;

import org.example.projet_pi.Dto.ComplaintDTO;
import org.example.projet_pi.Dto.ComplaintSearchDTO;
import org.example.projet_pi.Repository.ComplaintRepository;
import org.example.projet_pi.entity.Complaint;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ComplaintService implements IComplaintService {

    private final ComplaintRepository complaintRepository;
    private final SmsService3 smsService3;

    public ComplaintService(ComplaintRepository complaintRepository, SmsService3 smsService3) {
        this.complaintRepository = complaintRepository;
        this.smsService3 = smsService3;
    }

    // ================= DTO -> ENTITY =================
    private Complaint mapToEntity(ComplaintDTO dto) {
        Complaint c = new Complaint();
        c.setId(dto.getId());
        c.setStatus(dto.getStatus());
        c.setMessage(dto.getMessage());

        if (dto.getClaimDate() != null)
            c.setClaimDate(java.sql.Timestamp.valueOf(dto.getClaimDate()));

        if (dto.getResolutionDate() != null)
            c.setResolutionDate(java.sql.Timestamp.valueOf(dto.getResolutionDate()));

        return c;
    }

    // ================= ENTITY -> DTO =================
    private ComplaintDTO mapToDTO(Complaint c) {
        ComplaintDTO dto = new ComplaintDTO();
        dto.setId(c.getId());
        dto.setStatus(c.getStatus());
        dto.setMessage(c.getMessage());

        if (c.getClaimDate() != null)
            dto.setClaimDate(c.getClaimDate().toInstant()
                    .atZone(ZoneId.systemDefault()).toLocalDateTime());

        if (c.getResolutionDate() != null)
            dto.setResolutionDate(c.getResolutionDate().toInstant()
                    .atZone(ZoneId.systemDefault()).toLocalDateTime());

        if (c.getClient() != null)
            dto.setClientId(c.getClient().getId());

        if (c.getAgentAssurance() != null)
            dto.setAgentAssuranceId(c.getAgentAssurance().getId());

        if (c.getAgentFinance() != null)
            dto.setAgentFinanceId(c.getAgentFinance().getId());

        return dto;
    }

    // ================= CRUD =================

    @Override
    public ComplaintDTO addComplaint(ComplaintDTO dto) {
        Complaint complaint = mapToEntity(dto);
        Complaint saved = complaintRepository.save(complaint);

        if (saved.getPhone() != null) {
            smsService3.sendSms(
                    saved.getPhone(),
                    "Votre réclamation est bien envoyée."
            );
        }

        return mapToDTO(saved);
    }

    @Override
    public ComplaintDTO updateComplaint(Long id, ComplaintDTO dto) {
        Complaint existing = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        existing.setStatus(dto.getStatus());
        existing.setMessage(dto.getMessage());

        Complaint updated = complaintRepository.save(existing);
        return mapToDTO(updated);
    }

    @Override
    public void deleteComplaint(Long id) {
        complaintRepository.deleteById(id);
    }

    @Override
    public ComplaintDTO getComplaintById(Long id) {
        Complaint c = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        return mapToDTO(c);
    }

    @Override
    public List<ComplaintDTO> getAllComplaints() {
        return complaintRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // ================= SEARCH =================

    @Override
    public List<ComplaintDTO> searchComplaints(ComplaintSearchDTO dto) {
        return complaintRepository.searchComplaints(
                dto.getStatus(),
                dto.getKeyword(),
                dto.getClientId(),
                dto.getAgentAssuranceId(),
                dto.getAgentFinanceId(),
                dto.getDateDebut(),
                dto.getDateFin()
        ).stream().map(this::mapToDTO).toList();
    }

    // ================= KPI =================

    @Override
    public double calculateAverageProcessingTime() {
        List<Complaint> closed = complaintRepository.findByStatus("CLOSED");

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

    @Override
    public double resolutionRate() {
        long total = complaintRepository.count();
        long resolved = complaintRepository.countByStatus("APPROVED");
        return total == 0 ? 0 : (resolved * 100.0) / total;
    }

    @Override
    public double rejectionRate() {
        long total = complaintRepository.count();
        long rejected = complaintRepository.countByStatus("REJECTED");
        return total == 0 ? 0 : (rejected * 100.0) / total;
    }

    @Override
    public String findTopAgent() {
        return "TODO"; // tu peux garder ton code existant
    }

    @Override
    public Map<String, Object> getDashboardKpi() {
        Map<String, Object> map = new HashMap<>();
        map.put("averageProcessingTime", calculateAverageProcessingTime());
        map.put("resolutionRate", resolutionRate());
        map.put("rejectionRate", rejectionRate());
        map.put("topAgent", findTopAgent());
        return map;
    }
}