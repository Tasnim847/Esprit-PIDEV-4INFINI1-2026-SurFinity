package org.example.projet_pi.Controller;

import lombok.RequiredArgsConstructor;
import org.example.projet_pi.Repository.UserRepository;
import org.example.projet_pi.config.JwtUtils;
import org.example.projet_pi.entity.Role;
import org.example.projet_pi.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user){

        if(userRepository.findByEmail(user.getEmail()).isPresent()){
            return ResponseEntity.badRequest().body("Email already exists");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Role automatique
        if(user.getRole() == null){
            user.setRole(Role.CLIENT);
        }

        return ResponseEntity.ok(userRepository.save(user));
    }
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user){

        try{

            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    user.getEmail(),
                                    user.getPassword()
                            )
                    );

            Map<String,Object> data = new HashMap<>();

            data.put("token",
                    jwtUtils.generateToken(user.getEmail())
            );

            data.put("role",
                    authentication.getAuthorities()
                            .stream()
                            .map(a -> a.getAuthority())
                            .toList()
            );

            return ResponseEntity.ok(data);

        }catch(AuthenticationException e){
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid credentials");
        }
    }
}