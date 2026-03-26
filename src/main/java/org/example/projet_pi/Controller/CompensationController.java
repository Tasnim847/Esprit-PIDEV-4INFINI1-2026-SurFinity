package org.example.projet_pi.Controller;

import lombok.AllArgsConstructor;
import org.example.projet_pi.Dto.ClaimScoreDTO;
import org.example.projet_pi.Repository.ClaimRepository;
import org.example.projet_pi.Service.AdvancedClaimScoringService;
import org.example.projet_pi.Service.CompensationService;
import org.example.projet_pi.Dto.CompensationDTO;
import org.example.projet_pi.entity.Claim;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@AllArgsConstructor
@RequestMapping("/compensations")
public class CompensationController {

    private final CompensationService compensationService;
    private final AdvancedClaimScoringService advancedClaimScoringService;
    private final ClaimRepository claimRepository;

    @PostMapping("/addComp")
    public CompensationDTO addCompensation(@RequestBody CompensationDTO dto) {
        return compensationService.addCompensation(dto);
    }

    @PutMapping("/updateComp")
    public CompensationDTO updateCompensation(@RequestBody CompensationDTO dto) {
        return compensationService.updateCompensation(dto);
    }

    @DeleteMapping("/deleteComp/{id}")
    public void deleteCompensation(@PathVariable Long id) {
        compensationService.deleteCompensation(id);
    }

    @GetMapping("/getComp/{id}")
    public CompensationDTO getCompensationById(@PathVariable Long id) {
        return compensationService.getCompensationById(id);
    }

    @GetMapping("/allComp")
    public List<CompensationDTO> getAllCompensations() {
        return compensationService.getAllCompensations();
    }

    // NOUVEAU: Marquer comme payée
    @PostMapping("/{id}/pay")
    public ResponseEntity<CompensationDTO> markAsPaid(@PathVariable Long id) {
        CompensationDTO result = compensationService.markAsPaid(id);
        return ResponseEntity.ok(result);
    }

    // NOUVEAU: Recalculer la compensation
    @PostMapping("/recalculate/{claimId}")
    public ResponseEntity<CompensationDTO> recalculateCompensation(@PathVariable Long claimId) {
        CompensationDTO result = compensationService.recalculateCompensation(claimId);
        return ResponseEntity.ok(result);
    }

    // NOUVEAU: Obtenir les détails avec le message explicatif
    @GetMapping("/{id}/details")
    public ResponseEntity<Map<String, Object>> getCompensationDetails(@PathVariable Long id) {
        CompensationDTO compensation = compensationService.getCompensationById(id);

        Map<String, Object> details = new HashMap<>();
        details.put("compensation", compensation);
        details.put("calculationFormula", Map.of(
                "formula", "min(max(0, approvedAmount - deductible), coverageLimit)",
                "clientOutOfPocket", "approvedAmount - insurancePayment"
        ));

        if (compensation.getMessage() != null) {
            details.put("explanation", compensation.getMessage());
        }

        return ResponseEntity.ok(details);
    }

    // Dans CompensationController.java - AJOUTER

    @GetMapping("/{id}/with-scoring")
    public ResponseEntity<Map<String, Object>> getCompensationWithScoring(@PathVariable Long id) {
        CompensationDTO compensation = compensationService.getCompensationById(id);

        // Récupérer le claim correspondant
        Claim claim = claimRepository.findById(compensation.getClaimId())
                .orElseThrow(() -> new RuntimeException("Claim non trouvé"));

        // Calculer le scoring avancé
        ClaimScoreDTO claimScore = advancedClaimScoringService.calculateAdvancedClaimScore(claim.getClaimId());

        Map<String, Object> response = new HashMap<>();
        response.put("compensation", compensation);
        response.put("claimScore", claimScore);
        response.put("integration", Map.of(
                "status", "FULLY_INTEGRATED",
                "scoreUsedInCalculation", true,
                "adjustmentsApplied", compensation.getAmount() != compensation.getInsurancePayment(),
                "message", "La compensation a été calculée en utilisant le scoring avancé"
        ));

        return ResponseEntity.ok(response);
    }
}