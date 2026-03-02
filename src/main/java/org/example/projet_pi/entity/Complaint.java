package org.example.projet_pi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String status;
    private String message;

    @Temporal(TemporalType.TIMESTAMP)
    private Date claimDate;       // date de création de la réclamation

    @Temporal(TemporalType.TIMESTAMP)
    private Date resolutionDate;  // date de résolution

    @ManyToOne
    @JoinColumn(name = "client_id")
    private User client;

    @ManyToOne
    @JoinColumn(name = "agent_assurance_id")
    private User agentAssurance;

    @ManyToOne
    @JoinColumn(name = "agent_finance_id")
    private User agentFinance;
}