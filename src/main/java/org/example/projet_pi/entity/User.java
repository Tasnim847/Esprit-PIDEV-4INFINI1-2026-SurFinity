package org.example.projet_pi.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String otp;
    private Date otpExpiry;

    @Enumerated(EnumType.STRING)
    private Role role;

    // ---------------- Getters & Setters déjà gérés par Lombok ----------------
    // Mais tu peux garder les custom si besoin

    public String getName() {
        return firstName + " " + lastName; // <- retourne bien quelque chose
    }
}