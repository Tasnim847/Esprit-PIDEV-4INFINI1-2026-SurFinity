package org.example.projet_pi.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "login_history") // optionnel, pour nommer explicitement la table
public class LoginHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relation Many-to-One vers User
    @ManyToOne(fetch = FetchType.LAZY) // lazy loading pour éviter de charger tous les users à chaque login
    @JoinColumn(name = "user_id", nullable = false) // clé étrangère user_id
    private User user;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "login_time", nullable = false)
    private Date loginTime;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String country;


    private Double latitude;


    private Double longitude;
}