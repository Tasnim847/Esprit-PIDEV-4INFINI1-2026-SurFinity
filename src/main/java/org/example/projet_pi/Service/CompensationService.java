package org.example.projet_pi.Service;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.projet_pi.Dto.ClaimScoreDTO;
import org.example.projet_pi.Repository.CompensationRepository;
import org.example.projet_pi.Repository.ClaimRepository;
import org.example.projet_pi.Dto.CompensationDTO;
import org.example.projet_pi.entity.*;
import org.example.projet_pi.Mapper.CompensationMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class CompensationService implements ICompensationService {

    private final CompensationRepository compensationRepository;
    private final ClaimRepository claimRepository;
    private final AdvancedClaimScoringService advancedClaimScoringService;

    @Override
    @Transactional
    public CompensationDTO addCompensation(CompensationDTO dto) {
        if (dto.getClaimId() == null) {
            throw new IllegalArgumentException("claimId ne peut pas être null !");
        }

        Claim claim = claimRepository.findById(dto.getClaimId())
                .orElseThrow(() -> new RuntimeException("Claim not found"));

        // RÈGLE MÉTIER: La compensation ne peut être ajoutée que si le claim est APPROVED
        if (claim.getStatus() != ClaimStatus.APPROVED) {
            throw new RuntimeException("La compensation ne peut être ajoutée que si le claim est APPROVED !");
        }

        // Vérifier qu'il n'y a pas déjà une compensation
        if (claim.getCompensation() != null) {
            throw new RuntimeException("Ce claim possède déjà une compensation !");
        }

        // 🔥 NOUVEAU: Calculer le scoring avancé du claim
        ClaimScoreDTO claimScore = advancedClaimScoringService.calculateAdvancedClaimScore(claim.getClaimId());

        log.info("📊 Scoring avancé pour claim {}: score={}, niveau={}, décision={}",
                claim.getClaimId(), claimScore.getRiskScore(),
                claimScore.getRiskLevel(), claimScore.getDecisionSuggestion());

        InsuranceContract contract = claim.getContract();
        if (contract == null) {
            throw new RuntimeException("Le claim n'est pas lié à un contrat !");
        }

        // CALCUL DES MONTANTS selon les règles métier
        double claimedAmount = claim.getClaimedAmount();
        double approvedAmount = claim.getApprovedAmount() > 0 ? claim.getApprovedAmount() : claimedAmount;
        double deductible = contract.getDeductible();
        double coverageLimit = contract.getCoverageLimit();

        // 📌 RÈGLE MÉTIER: min(max(0, montant - franchise), plafond)
        double afterDeductible = Math.max(0, approvedAmount - deductible);
        double baseInsurancePayment = Math.min(afterDeductible, coverageLimit);

        // 🔥 NOUVEAU: Ajuster le montant en fonction du scoring
        double adjustedInsurancePayment = baseInsurancePayment;
        double adjustmentPercentage = 0.0;
        String adjustmentReason = "";

        if (claimScore.getRiskScore() < 40) {
            // Risque élevé - pénalité
            adjustmentPercentage = 0.15; // 15% de pénalité
            adjustedInsurancePayment = baseInsurancePayment * (1 - adjustmentPercentage);
            adjustmentReason = "Risque élevé détecté (score: " + claimScore.getRiskScore() + ")";
            log.warn("⚠️ Pénalité de {}% appliquée pour risque élevé", adjustmentPercentage * 100);
        } else if (claimScore.getRiskScore() > 80) {
            // Risque très faible - bonus
            adjustmentPercentage = 0.05; // 5% de bonus
            adjustedInsurancePayment = Math.min(coverageLimit, baseInsurancePayment * (1 + adjustmentPercentage));
            adjustmentReason = "Risque très faible (score: " + claimScore.getRiskScore() + ")";
            log.info("✅ Bonus de {}% appliqué pour risque très faible", adjustmentPercentage * 100);
        }

        // S'assurer que le montant ajusté ne dépasse pas le plafond
        adjustedInsurancePayment = Math.min(adjustedInsurancePayment, coverageLimit);
        double clientOutOfPocket = approvedAmount - adjustedInsurancePayment;

        // Générer un message explicatif avec le scoring
        String message = generateCompensationMessageWithScoring(
                approvedAmount, deductible, coverageLimit,
                adjustedInsurancePayment, clientOutOfPocket,
                claimScore, adjustmentPercentage, adjustmentReason
        );

        // Créer la compensation avec tous les détails
        Compensation compensation = new Compensation();
        compensation.setAmount(adjustedInsurancePayment);
        compensation.setAdjustedAmount(adjustedInsurancePayment);
        compensation.setPaymentDate(dto.getPaymentDate() != null ? dto.getPaymentDate() : new Date());
        compensation.setClaim(claim);
        compensation.setClientOutOfPocket(clientOutOfPocket);
        compensation.setCoverageLimit(coverageLimit);
        compensation.setDeductible(deductible);
        compensation.setOriginalClaimedAmount(claimedAmount);
        compensation.setApprovedAmount(approvedAmount);
        compensation.setMessage(message);
        compensation.setStatus(CompensationStatus.CALCULATED);
        compensation.setCalculationDate(new Date());

        // 🔥 STOCKER LE SCORING
        compensation.setRiskScore(claimScore.getRiskScore());
        compensation.setRiskLevel(claimScore.getRiskLevel());
        compensation.setDecisionSuggestion(claimScore.getDecisionSuggestion().toString());
        compensation.setScoringDetails(String.format(
                "Score: %d/100 | Niveau: %s | Décision: %s | Facteurs: Montant=%s, Délai=%s, Documents=%s, Fréquence=%s",
                claimScore.getRiskScore(),
                claimScore.getRiskLevel(),
                claimScore.getDecisionSuggestion(),
                claimScore.getDelayInfo(),
                claimScore.getDocumentTypeInfo(),
                claimScore.getFrequencyInfo()
        ));

        // Sauvegarde
        compensation = compensationRepository.save(compensation);

        // Mettre à jour le claim
        claim.setCompensation(compensation);
        claim.setStatus(ClaimStatus.COMPENSATED);
        claimRepository.save(claim);

        log.info("✅ Compensation créée pour claim {}: assurance={} DT, reste à charge={} DT, score risque={}",
                claim.getClaimId(), adjustedInsurancePayment, clientOutOfPocket, claimScore.getRiskScore());

        if (approvedAmount > coverageLimit) {
            log.warn("⚠️ DÉPASSEMENT DE PLAFOND: Client doit payer {} DT en supplément", clientOutOfPocket);
        }

        return CompensationMapper.toDTO(compensation);
    }

    /**
     * Génère un message avec les détails du scoring
     */
    private String generateCompensationMessageWithScoring(double approvedAmount, double deductible,
                                                          double coverageLimit, double insurancePayment,
                                                          double clientOutOfPocket, ClaimScoreDTO score,
                                                          double adjustmentPercentage, String adjustmentReason) {
        StringBuilder message = new StringBuilder();

        message.append("📋 DÉTAILS DU REMBOURSEMENT\n");
        message.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");

        // Partie calcul standard
        if (approvedAmount > coverageLimit) {
            message.append(String.format(
                    "⚠️ ATTENTION: Votre réclamation (%.2f DT) dépasse le plafond du contrat (%.2f DT).\n",
                    approvedAmount, coverageLimit
            ));
            message.append(String.format(
                    "L'assurance prend en charge uniquement %.2f DT (plafond maximum).\n\n",
                    coverageLimit
            ));
        }

        message.append("💰 CALCUL DU REMBOURSEMENT:\n");
        message.append(String.format("   • Montant approuvé: %.2f DT\n", approvedAmount));
        message.append(String.format("   • Franchise: %.2f DT\n", deductible));
        message.append(String.format("   • Plafond contrat: %.2f DT\n", coverageLimit));
        message.append(String.format("   • Formule: min(max(%.2f - %.2f, 0), %.2f)\n",
                approvedAmount, deductible, coverageLimit));

        if (adjustmentPercentage > 0) {
            message.append(String.format("   • Ajustement scoring: %.0f%% (%s)\n",
                    adjustmentPercentage * 100, adjustmentReason));
        }

        message.append(String.format("   • Montant pris en charge: %.2f DT\n", insurancePayment));
        message.append(String.format("   • Reste à charge: %.2f DT\n\n", clientOutOfPocket));

        // Partie scoring avancé
        if (score != null) {
            message.append("🎯 ANALYSE AVANCÉE DU RISQUE\n");
            message.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            message.append(String.format("   • Score de risque: %d/100\n", score.getRiskScore()));
            message.append(String.format("   • Niveau: %s %s\n", score.getColorCode(), score.getRiskLevel()));
            message.append(String.format("   • Décision suggérée: %s\n", score.getDecisionSuggestion()));

            if (score.getRiskScore() >= 70) {
                message.append("   ✅ Risque faible - Traitement prioritaire\n");
            } else if (score.getRiskScore() >= 40) {
                message.append("   ⚠️ Risque modéré - Surveillance recommandée\n");
            } else {
                message.append("   🔴 Risque élevé - Vérification approfondie\n");
            }

            message.append("\n📊 FACTEURS ANALYSÉS:\n");
            if (score.getDelayInfo() != null && !score.getDelayInfo().isEmpty()) {
                message.append(String.format("   • Délai: %s\n", score.getDelayInfo()));
            }
            if (score.getDocumentTypeInfo() != null && !score.getDocumentTypeInfo().isEmpty()) {
                message.append(String.format("   • Documents: %s\n", score.getDocumentTypeInfo()));
            }
            if (score.getFrequencyInfo() != null && !score.getFrequencyInfo().isEmpty()) {
                message.append(String.format("   • Fréquence: %s\n", score.getFrequencyInfo()));
            }

            message.append("\n💡 RECOMMANDATION:\n");
            message.append(String.format("   %s\n", score.getRecommendation()));
        }

        return message.toString();
    }
    /**
     * Génère un message clair pour le client expliquant le calcul
     */
    private String generateCompensationMessage(double approvedAmount, double deductible,
                                               double coverageLimit, double insurancePayment,
                                               double clientOutOfPocket) {
        StringBuilder message = new StringBuilder();

        if (approvedAmount > coverageLimit) {
            message.append(String.format(
                    "⚠️ ATTENTION: Votre réclamation (%.2f DT) dépasse le plafond du contrat (%.2f DT).\n",
                    approvedAmount, coverageLimit
            ));
            message.append(String.format(
                    "L'assurance prend en charge uniquement %.2f DT (plafond maximum).\n",
                    coverageLimit
            ));
            message.append(String.format(
                    "Le reste, soit %.2f DT, reste à votre charge.\n",
                    clientOutOfPocket
            ));
        } else if (approvedAmount > deductible) {
            message.append(String.format(
                    "✅ Prise en charge: %.2f DT (après déduction de la franchise de %.2f DT)\n",
                    insurancePayment, deductible
            ));
            message.append(String.format(
                    "Reste à votre charge: %.2f DT\n",
                    clientOutOfPocket
            ));
        } else {
            message.append(String.format(
                    "ℹ️ Le montant approuvé (%.2f DT) est inférieur ou égal à votre franchise (%.2f DT).\n",
                    approvedAmount, deductible
            ));
            message.append("Aucun remboursement n'est effectué par l'assurance.\n");
            message.append("L'intégralité du montant reste à votre charge.\n");
        }

        message.append("\nDétails du calcul:\n");
        message.append(String.format("- Montant approuvé: %.2f DT\n", approvedAmount));
        message.append(String.format("- Franchise: %.2f DT\n", deductible));
        message.append(String.format("- Plafond contrat: %.2f DT\n", coverageLimit));
        message.append(String.format("- Montant pris en charge: %.2f DT\n", insurancePayment));
        message.append(String.format("- Reste à charge: %.2f DT\n", clientOutOfPocket));

        return message.toString();
    }

    @Override
    @Transactional
    public CompensationDTO updateCompensation(CompensationDTO dto) {
        Compensation compensation = compensationRepository.findById(dto.getCompensationId())
                .orElseThrow(() -> new RuntimeException("Compensation not found"));

        // Vérifier le statut avant modification
        if (compensation.getStatus() == CompensationStatus.PAID) {
            throw new RuntimeException("Impossible de modifier une compensation déjà payée !");
        }

        // Mise à jour des champs
        if (dto.getAmount() != null) {
            compensation.setAmount(dto.getAmount());
            // Recalculer le reste à charge si le montant change
            if (compensation.getApprovedAmount() != null) {
                compensation.setClientOutOfPocket(compensation.getApprovedAmount() - dto.getAmount());
            }
        }

        if (dto.getPaymentDate() != null) {
            compensation.setPaymentDate(dto.getPaymentDate());
        }

        if (dto.getStatus() != null) {
            compensation.setStatus(dto.getStatus());
        }

        if (dto.getMessage() != null) {
            compensation.setMessage(dto.getMessage());
        }

        compensation = compensationRepository.save(compensation);

        log.info("✅ Compensation {} mise à jour", compensation.getCompensationId());

        return CompensationMapper.toDTO(compensation);
    }

    @Override
    public void deleteCompensation(Long id) {
        Compensation compensation = compensationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compensation not found"));

        // Ne pas supprimer si déjà payée
        if (compensation.getStatus() == CompensationStatus.PAID) {
            throw new RuntimeException("Impossible de supprimer une compensation déjà payée !");
        }

        // Détacher du claim
        if (compensation.getClaim() != null) {
            Claim claim = compensation.getClaim();
            claim.setCompensation(null);
            claim.setStatus(ClaimStatus.APPROVED); // Retour au statut APPROVED
            claimRepository.save(claim);
        }

        compensationRepository.deleteById(id);
        log.info("🗑️ Compensation {} supprimée", id);
    }

    @Override
    public CompensationDTO getCompensationById(Long id) {
        Compensation compensation = compensationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compensation not found"));
        return CompensationMapper.toDTO(compensation);
    }

    @Override
    public List<CompensationDTO> getAllCompensations() {
        return compensationRepository.findAll().stream()
                .map(CompensationMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * NOUVEAU: Marquer une compensation comme payée
     */
    @Transactional
    public CompensationDTO markAsPaid(Long compensationId) {
        Compensation compensation = compensationRepository.findById(compensationId)
                .orElseThrow(() -> new RuntimeException("Compensation not found"));

        compensation.setStatus(CompensationStatus.PAID);
        compensation.setPaymentDate(new Date());
        compensation = compensationRepository.save(compensation);

        log.info("💰 Compensation {} marquée comme payée", compensationId);

        return CompensationMapper.toDTO(compensation);
    }

    /**
     * NOUVEAU: Recalculer la compensation (utile si le claim est modifié)
     */
    @Transactional
    public CompensationDTO recalculateCompensation(Long claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found"));

        if (claim.getStatus() != ClaimStatus.APPROVED) {
            throw new RuntimeException("Seuls les claims APPROVED peuvent être recalculés");
        }

        // Supprimer l'ancienne compensation si elle existe
        if (claim.getCompensation() != null) {
            compensationRepository.delete(claim.getCompensation());
            claim.setCompensation(null);
        }

        // Recréer avec les nouvelles règles
        CompensationDTO dto = new CompensationDTO();
        dto.setClaimId(claimId);

        return addCompensation(dto);
    }
}