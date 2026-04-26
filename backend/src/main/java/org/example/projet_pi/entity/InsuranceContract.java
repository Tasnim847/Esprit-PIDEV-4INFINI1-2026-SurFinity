package org.example.projet_pi.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;  // ← IMPORT
import lombok.Getter;
import lombok.Setter;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@Entity
public class InsuranceContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long contractId;

    private Date startDate;
    private Date endDate;

    private Double premium;
    private Double deductible;
    private Double coverageLimit;

    // 🔥 NOUVEAUX CHAMPS
    private Double totalPaid = 0.0;
    private Double remainingAmount;

    private Integer contractDurationYears; // durée en années

    @Enumerated(EnumType.STRING)
    private ContractStatus status;

    @OneToOne(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore  // ← AJOUTER CEÇI (optionnel, mais bonne pratique)
    private RiskClaim riskClaim;

    @Enumerated(EnumType.STRING)
    private PaymentFrequency paymentFrequency;

    @ManyToOne
    @JsonIgnore  // ← AJOUTER CEÇI
    private Client client;

    @ManyToOne
    @JsonIgnore  // ← AJOUTER CEÇI
    private InsuranceProduct product;

    @ManyToOne
    @JsonIgnore  // ← AJOUTER CEÇI
    private AgentAssurance agentAssurance;

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL)
    @JsonIgnore  // ← AJOUTER CEÇI
    private List<Claim> claims;

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL)
    @JsonIgnore  // ← AJOUTER CEÇI
    private List<Payment> payments;

    // ============================================================
// 🔥 CALCUL DES ÉCHÉANCES SELON LA FRÉQUENCE
// ============================================================
    public double calculateInstallmentAmount() {
        if (paymentFrequency == null || premium == null || premium == 0) return 0;

        // Calculer la durée en années
        if (startDate == null || endDate == null) return premium;

        long durationInMillis = endDate.getTime() - startDate.getTime();
        long durationInYears = durationInMillis / (1000L * 60 * 60 * 24 * 365);

        if (durationInYears < 1) durationInYears = 1;

        double premiumPerYear = premium / durationInYears;
        double installmentAmount = 0;

        switch (paymentFrequency) {
            case MONTHLY:
                installmentAmount = premiumPerYear / 12;
                break;
            case SEMI_ANNUAL:
                installmentAmount = premiumPerYear / 2;
                break;
            case ANNUAL:
                installmentAmount = premiumPerYear;
                break;
            default:
                installmentAmount = premium;
        }

        return Math.round(installmentAmount * 100.0) / 100.0;
    }
    /**
     * Calcule le nombre total de paiements pour le contrat
     */
    public int getTotalNumberOfPayments() {
        if (paymentFrequency == null || startDate == null || endDate == null) return 1;

        long durationInMillis = endDate.getTime() - startDate.getTime();
        long durationInYears = durationInMillis / (1000L * 60 * 60 * 24 * 365);

        if (durationInYears < 1) durationInYears = 1;

        switch (paymentFrequency) {
            case MONTHLY:
                return (int) (durationInYears * 12);
            case SEMI_ANNUAL:
                return (int) (durationInYears * 2);
            case ANNUAL:
                return (int) durationInYears;
            default:
                return 1;
        }
    }

    // 🔥 INITIALISATION
    public void initializeAmounts() {
        this.totalPaid = 0.0;
        this.remainingAmount = this.premium;
    }

    // 🔥 LOGIQUE MÉTIER AVANCÉE
    public void applyPayment(double amount) {
        if (amount <= 0) {
            throw new RuntimeException("Montant invalide");
        }

        if (amount > remainingAmount) {
            throw new RuntimeException("Paiement dépasse le montant restant");
        }

        this.totalPaid += amount;
        this.remainingAmount -= amount;

        if (this.remainingAmount <= 0.01) {
            this.remainingAmount = 0.0;
            this.status = ContractStatus.COMPLETED;
        }
    }
}