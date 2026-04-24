package org.example.projet_pi.entity;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {
    private String email;
    private String password;
    private Double clientLat;   // ✅ Coordonnées GPS du navigateur
    private Double clientLon;
}