package org.example.projet_pi.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 🔹 Désactive CSRF pour POST/PUT/DELETE depuis Postman
                .csrf(csrf -> csrf.disable())

                // 🔹 Autorisation des endpoints
                .authorizeHttpRequests(auth -> auth
                        // Swagger et docs
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                        // Complaints (test Postman)
                        .requestMatchers("/complaints/**").permitAll()

                        // Endpoints publics (auth/otp)
                        .requestMatchers("/api/auth/**", "/api/otp/**").permitAll()

                        // Admin uniquement
                        .requestMatchers("/admins/**").hasAuthority("ADMIN")

                        // Agent uniquement
                        .requestMatchers("/agents-assurance/**").hasAnyAuthority("AGENT_ASSURANCE", "ADMIN")

                        // Tout le reste nécessite authentification
                        .anyRequest().authenticated()
                )

                // 🔹 Pas de session, API stateless
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        return http.build();
    }
}