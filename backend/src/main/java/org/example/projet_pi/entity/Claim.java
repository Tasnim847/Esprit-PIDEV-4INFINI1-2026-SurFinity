package org.example.projet_pi.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;  // ← IMPORT
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Getter
@Setter
@Entity
public class Claim {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long claimId;

    @Temporal(TemporalType.DATE)
    private Date claimDate;

    private Double claimedAmount;
    private Double approvedAmount;

    private String description;

    @Enumerated(EnumType.STRING)
    private ClaimStatus status;

    @ManyToOne
    @JsonIgnore  // ← AJOUTER CEÇI
    private Client client;

    @ManyToOne
    @JsonIgnore  // ← AJOUTER CEÇI
    private InsuranceContract contract;

    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL)
    @JsonIgnore  // ← AJOUTER CEÇI
    private Compensation compensation;

    @OneToMany(mappedBy = "claim", cascade = CascadeType.ALL)
    @JsonIgnore  // ← AJOUTER CEÇI
    private List<Document> documents= new ArrayList<>();


    private Boolean fraud = false;
    private String message;

    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL)
    @JsonIgnore  // ← AJOUTER CEÇI
    private AutoClaimDetails autoDetails;

    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL)
    @JsonIgnore  // ← AJOUTER CEÇI
    private HealthClaimDetails healthDetails;

    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL)
    @JsonIgnore  // ← AJOUTER CEÇI
    private HomeClaimDetails homeDetails;

}
