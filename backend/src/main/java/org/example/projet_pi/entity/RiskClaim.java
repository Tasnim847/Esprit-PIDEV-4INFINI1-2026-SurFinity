package org.example.projet_pi.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;  // ← AJOUTER CET IMPORT
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class RiskClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long riskId;

    private Double riskScore;
    private String riskLevel;

    @Column(length = 5000)
    private String evaluationNote;

    @OneToOne
    @JoinColumn(name = "contract_id")
    @JsonIgnore  // ← AJOUTER CEÇI pour casser la boucle
    private InsuranceContract contract;
}