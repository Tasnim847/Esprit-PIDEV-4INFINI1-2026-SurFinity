<<<<<<< HEAD
package org.example.projet_pi.Controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.example.projet_pi.Repository.LoginHistoryRepository;
import org.example.projet_pi.Repository.UserRepository;
import org.example.projet_pi.Service.EmailService2;
import org.example.projet_pi.Service.SmsService3;
import org.example.projet_pi.config.JwtUtils;
import org.example.projet_pi.entity.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final EmailService2 emailService;
    private final SmsService3 smsService3;
    private final LoginHistoryRepository loginHistoryRepository;


    //localisation
    public String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-FORWARDED-FOR");
        if (xfHeader == null){
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }



    // --- Méthode pour récupérer la localisation à partir de l'IP ---
    private Map<String, Object> getLocation(String ip){
        RestTemplate restTemplate = new RestTemplate();
        String url = "http://ip-api.com/json/" + ip;
        return restTemplate.getForObject(url, Map.class);
    }

    @PostMapping(value = "/register", consumes = "multipart/form-data")
    public ResponseEntity<?> register(
            @RequestParam("firstName") String firstName,
            @RequestParam("lastName") String lastName,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("telephone") String telephone,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ) {

        try {
            //  Vérifier email existant
            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body("Email already exists");
            }

            //  Upload photo
            String fileName = null;
            if (photo != null && !photo.isEmpty()) {
                fileName = uploadPhoto(photo);
            }

            //  Encoder password
            String encodedPassword = passwordEncoder.encode(password);

            //  Création utilisateur
            Client client = new Client();
            client.setFirstName(firstName);
            client.setLastName(lastName);
            client.setEmail(email);
            client.setPassword(encodedPassword);
            client.setTelephone(telephone);
            client.setRole(Role.CLIENT);
            client.setPhoto(fileName);

            User savedUser = userRepository.save(client);

            //  EMAIL (sécurisé)
            try {
                emailService.sendWelcomeEmail(
                        savedUser.getEmail(),
                        savedUser.getFirstName()
                );
                System.out.println(" Email envoyé");
            } catch (Exception e) {
                System.out.println(" Erreur email: " + e.getMessage());
            }

            //  SMS (sécurisé)
            try {
                smsService3.sendSms(
                        savedUser.getTelephone(),
                        savedUser.getFirstName()
                );
                System.out.println(" SMS envoyé");
            } catch (Exception e) {
                System.out.println("Erreur SMS: " + e.getMessage());
            }

            return ResponseEntity.ok("User registered successfully");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l'inscription");
        }
    }



    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User userRequest, HttpServletRequest request) {
        String ip = getClientIP(request);
        Map<String, Object> location = getLocation(ip);

        try {
            //  Récupérer l'utilisateur
            User user = userRepository.findByEmail(userRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            //  Vérifier si compte bloqué
            if (!user.isAccountNonLocked()) {
                long lockDuration = 2 * 60 * 1000; // 2 minutes pour test

                if (user.getLockTime() != null &&
                        user.getLockTime().getTime() + lockDuration < System.currentTimeMillis()) {

                    //  Déblocage automatique
                    user.setAccountNonLocked(true);
                    user.setLoginAttempts(0);
                    user.setLockTime(null);
                    userRepository.save(user);

                } else {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("Votre compte est bloqué. Réessayez après 2 minutes.");
                }
            }

            //  Authentification
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            userRequest.getEmail(),
                            userRequest.getPassword()
                    )
            );

            //  Reset après succès
            user.setLoginAttempts(0);
            userRepository.save(user);

            // Historique login
            LoginHistory history = new LoginHistory();
            history.setUser(user);
            history.setLoginTime(new Date());
            history.setIpAddress(ip);
            if (location != null) {
                history.setCity((String) location.get("city"));
                history.setCountry((String) location.get("country"));
                history.setLatitude(location.get("lat") != null ? Double.valueOf(location.get("lat").toString()) : null);
                history.setLongitude(location.get("lon") != null ? Double.valueOf(location.get("lon").toString()) : null);
            }
            
            loginHistoryRepository.save(history);

            // 🎟 Token
            String token = jwtUtils.generateToken(
                    user.getEmail(),
                    user.getRole().name()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("role", user.getRole().name());

            return ResponseEntity.ok(response);

        } catch (AuthenticationException e) {
            User user = userRepository.findByEmail(userRequest.getEmail()).orElse(null);

            if (user != null) {
                int attempts = user.getLoginAttempts() + 1;
                user.setLoginAttempts(attempts);

                //  Bloquer après 5 tentatives
                if (attempts >= 5) {
                    user.setAccountNonLocked(false);
                    user.setLockTime(new Date());

                    //  SMS
                    smsService3.sendSms(
                            user.getTelephone(),
                            "Votre compte est bloqué pour 2 minutes suite à plusieurs tentatives échouées. Si ce n’est pas vous, contactez le support."
                    );
                }

                userRepository.save(user);
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Mot de passe incorrect");
        }
    }
    @PostMapping("/unlock-user/{id}")
    public ResponseEntity<?> unlockUser(@PathVariable Long id){

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setAccountNonLocked(true);
        user.setLoginAttempts(0);
        user.setLockTime(null);

        userRepository.save(user);

        return ResponseEntity.ok("User unlocked");
    }
    @GetMapping("/login-history/{userId}")
    public ResponseEntity<List<LoginHistory>> getHistory(@PathVariable Long userId){
        List<LoginHistory> history = loginHistoryRepository.findByUserId(userId);
        return ResponseEntity.ok(history);
    }
    private String uploadPhoto(MultipartFile file) {
        try {
            String uploadDir = "uploads/";
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path path = Paths.get(uploadDir + fileName);
            Files.createDirectories(path.getParent());
            Files.write(path, file.getBytes());
            return fileName;
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'upload de la photo");
        }
    }
=======
package org.example.projet_pi.Controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.example.projet_pi.Repository.LoginHistoryRepository;
import org.example.projet_pi.Repository.UserRepository;
import org.example.projet_pi.Service.EmailService2;
import org.example.projet_pi.Service.SmsServiceYosr;
import org.example.projet_pi.config.JwtUtils;
import org.example.projet_pi.entity.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final EmailService2 emailService;
    private final SmsServiceYosr smsServiceYosr;
    private final LoginHistoryRepository loginHistoryRepository;


    //localisation
    public String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-FORWARDED-FOR");
        if (xfHeader == null){
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }



    // --- Méthode pour récupérer la localisation à partir de l'IP ---
    private Map<String, Object> getLocation(String ip){
        RestTemplate restTemplate = new RestTemplate();
        String url = "http://ip-api.com/json/" + ip;
        return restTemplate.getForObject(url, Map.class);
    }

    @PostMapping(value = "/register", consumes = "multipart/form-data")
    public ResponseEntity<?> register(
            @RequestParam("firstName") String firstName,
            @RequestParam("lastName") String lastName,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("telephone") String telephone,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ) {

        try {
            //  Vérifier email existant
            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body("Email already exists");
            }

            //  Upload photo
            String fileName = null;
            if (photo != null && !photo.isEmpty()) {
                fileName = uploadPhoto(photo);
            }

            //  Encoder password
            String encodedPassword = passwordEncoder.encode(password);

            //  Création utilisateur
            Client client = new Client();
            client.setFirstName(firstName);
            client.setLastName(lastName);
            client.setEmail(email);
            client.setPassword(encodedPassword);
            client.setTelephone(telephone);
            client.setRole(Role.CLIENT);
            client.setPhoto(fileName);

            User savedUser = userRepository.save(client);

            //  EMAIL (sécurisé)
            try {
                emailService.sendWelcomeEmail(
                        savedUser.getEmail(),
                        savedUser.getFirstName()
                );
                System.out.println(" Email envoyé");
            } catch (Exception e) {
                System.out.println(" Erreur email: " + e.getMessage());
            }

            //  SMS (sécurisé)
            try {
                smsServiceYosr.sendSms(
                        savedUser.getTelephone(),
                        savedUser.getFirstName()
                );
                System.out.println(" SMS envoyé");
            } catch (Exception e) {
                System.out.println("Erreur SMS: " + e.getMessage());
            }

            return ResponseEntity.ok("User registered successfully");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l'inscription");
        }
    }



    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User userRequest, HttpServletRequest request) {
        String ip = getClientIP(request);
        Map<String, Object> location = getLocation(ip);

        try {
            //  Récupérer l'utilisateur
            User user = userRepository.findByEmail(userRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            //  Vérifier si compte bloqué
            if (!user.isAccountNonLocked()) {
                long lockDuration = 2 * 60 * 1000; // 2 minutes pour test

                if (user.getLockTime() != null &&
                        user.getLockTime().getTime() + lockDuration < System.currentTimeMillis()) {

                    //  Déblocage automatique
                    user.setAccountNonLocked(true);
                    user.setLoginAttempts(0);
                    user.setLockTime(null);
                    userRepository.save(user);

                } else {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("Votre compte est bloqué. Réessayez après 2 minutes.");
                }
            }

            //  Authentification
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            userRequest.getEmail(),
                            userRequest.getPassword()
                    )
            );

            //  Reset après succès
            user.setLoginAttempts(0);
            userRepository.save(user);

            // Historique login
            LoginHistory history = new LoginHistory();
            history.setUser(user);
            history.setLoginTime(new Date());
            history.setIpAddress(ip);
            if (location != null) {
                history.setCity((String) location.get("city"));
                history.setCountry((String) location.get("country"));
                history.setLatitude(location.get("lat") != null ? Double.valueOf(location.get("lat").toString()) : null);
                history.setLongitude(location.get("lon") != null ? Double.valueOf(location.get("lon").toString()) : null);
            }

            loginHistoryRepository.save(history);

            // 🎟 Token
            String token = jwtUtils.generateToken(
                    user.getEmail(),
                    user.getRole().name()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("role", user.getRole().name());

            return ResponseEntity.ok(response);

        } catch (AuthenticationException e) {
            User user = userRepository.findByEmail(userRequest.getEmail()).orElse(null);

            if (user != null) {
                int attempts = user.getLoginAttempts() + 1;
                user.setLoginAttempts(attempts);

                //  Bloquer après 5 tentatives
                if (attempts >= 5) {
                    user.setAccountNonLocked(false);
                    user.setLockTime(new Date());

                    //  SMS
                    smsServiceYosr.sendSms(
                            user.getTelephone(),
                            "Votre compte est bloqué pour 2 minutes suite à plusieurs tentatives échouées. Si ce n’est pas vous, contactez le support."
                    );
                }

                userRepository.save(user);
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Mot de passe incorrect");
        }
    }
    @PostMapping("/unlock-user/{id}")
    public ResponseEntity<?> unlockUser(@PathVariable Long id){

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setAccountNonLocked(true);
        user.setLoginAttempts(0);
        user.setLockTime(null);

        userRepository.save(user);

        return ResponseEntity.ok("User unlocked");
    }
    @GetMapping("/login-history/{userId}")
    public ResponseEntity<List<LoginHistory>> getHistory(@PathVariable Long userId){
        List<LoginHistory> history = loginHistoryRepository.findByUserId(userId);
        return ResponseEntity.ok(history);
    }
    private String uploadPhoto(MultipartFile file) {
        try {
            String uploadDir = "uploads/";
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path path = Paths.get(uploadDir + fileName);
            Files.createDirectories(path.getParent());
            Files.write(path, file.getBytes());
            return fileName;
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'upload de la photo");
        }
    }
>>>>>>> f0c4e72 (url de front)
}