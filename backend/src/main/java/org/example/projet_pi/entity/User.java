package org.example.projet_pi.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
<<<<<<< HEAD
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
=======
import jakarta.validation.constraints.*;
import lombok.*;
>>>>>>> f0c4e72 (url de front)

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

    //  FirstName : lettres seulement
    @NotBlank(message = "First name is required")
    @Pattern(regexp = "^[a-zA-Z]+$", message = "First name must contain only letters")
    private String firstName;

    // LastName : lettres seulement
    @NotBlank(message = "Last name is required")
    @Pattern(regexp = "^[a-zA-Z]+$", message = "Last name must contain only letters")
    private String lastName;


    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid (example: exemple@exemple.com)")
    @Column(unique = true)
    private String email;

    // Password sécurisé
    @NotBlank(message = "Password is required")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?\":{}|<>]).{8,}$",
            message = "Password must be at least 8 characters, contain 1 uppercase letter and 1 symbol"
    )
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;


    @NotBlank(message = "Telephone is required")
    @Pattern(
            regexp = "^\\+216\\d{8}$",
            message = "Telephone must start with +216 and contain 8 digits"
    )
    private String telephone;

    private String otp;
    private Date otpExpiry;

    private Integer loginAttempts = 0;

    private Boolean accountNonLocked = true;
    private Date lockTime;
    private String photo;

    @Enumerated(EnumType.STRING)
    private Role role;

    public boolean isAccountNonLocked() {
        return Boolean.TRUE.equals(this.accountNonLocked);
    }
}