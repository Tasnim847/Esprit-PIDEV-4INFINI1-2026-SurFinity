package org.example.projet_pi.Service;

import org.example.projet_pi.Dto.ComplaintSearchDTO;
import org.example.projet_pi.entity.Complaint;

import java.util.List;
import java.util.Map;

public interface IComplaintService {

    // 🔹 CRUD
    Complaint addComplaint(Complaint complaintDTO);
    Complaint updateComplaint(Complaint complaintDTO);
    void deleteComplaint(Long id);
    Complaint getComplaintById(Long id);
    List<Complaint> getAllComplaints();

    // 🔹 Recherche avancée
    List<Complaint> searchComplaints(ComplaintSearchDTO dto);

    // 🔥 KPI
    double calculateAverageProcessingTime();
    double resolutionRate();
    double rejectionRate();
    String findTopAgent();
    Map<String, Object> getDashboardKpi();
}