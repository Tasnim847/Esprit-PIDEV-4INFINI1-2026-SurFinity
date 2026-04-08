<<<<<<< HEAD
package org.example.projet_pi.Service;

import lombok.RequiredArgsConstructor;
import org.example.projet_pi.Repository.UserRepository;
import org.example.projet_pi.entity.Role;
import org.example.projet_pi.entity.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    //  ADD USER (Password encodé)
    @Override
    public User addUser(User user, MultipartFile photo) {

        if(user.getPassword() != null && !user.getPassword().isEmpty()){
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        // sécurité
        user.setRole(Role.CLIENT);

        // upload photo
        if(photo != null && !photo.isEmpty()){
            String fileName = uploadPhoto(photo);
            user.setPhoto(fileName);
        }

        return userRepository.save(user);
    }


    //  UPDATE BY ID (bonne pratique)
    @Override
    public User updateUserById(Long id, User user, MultipartFile photo) {

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if(user.getFirstName() != null)
            existingUser.setFirstName(user.getFirstName());

        if(user.getLastName() != null)
            existingUser.setLastName(user.getLastName());

        if(user.getEmail() != null)
            existingUser.setEmail(user.getEmail());

        if(user.getTelephone() != null)
            existingUser.setTelephone(user.getTelephone());

        if(user.getPassword() != null && !user.getPassword().isEmpty()){
            existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        // update photo
        if(photo != null && !photo.isEmpty()){
            String fileName = uploadPhoto(photo);
            existingUser.setPhoto(fileName);
        }

        return userRepository.save(existingUser);
    }

    @Override
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public List<User> searchUsers(String keyword) {
        return userRepository.searchUsers(keyword);
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
            throw new RuntimeException("Erreur upload photo");
        }
    }


=======
package org.example.projet_pi.Service;

import lombok.RequiredArgsConstructor;
import org.example.projet_pi.Repository.UserRepository;
import org.example.projet_pi.entity.Role;
import org.example.projet_pi.entity.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements IUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    //  ADD USER (Password encodé)
    @Override
    public User addUser(User user, MultipartFile photo) {

        if(user.getPassword() != null && !user.getPassword().isEmpty()){
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        // sécurité
        user.setRole(Role.CLIENT);

        // upload photo
        if(photo != null && !photo.isEmpty()){
            String fileName = uploadPhoto(photo);
            user.setPhoto(fileName);
        }

        return userRepository.save(user);
    }


    //  UPDATE BY ID (bonne pratique)
    @Override
    public User updateUserById(Long id, User user, MultipartFile photo) {

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if(user.getFirstName() != null)
            existingUser.setFirstName(user.getFirstName());

        if(user.getLastName() != null)
            existingUser.setLastName(user.getLastName());

        if(user.getEmail() != null)
            existingUser.setEmail(user.getEmail());

        if(user.getTelephone() != null)
            existingUser.setTelephone(user.getTelephone());

        if(user.getPassword() != null && !user.getPassword().isEmpty()){
            existingUser.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        // update photo
        if(photo != null && !photo.isEmpty()){
            String fileName = uploadPhoto(photo);
            existingUser.setPhoto(fileName);
        }

        return userRepository.save(existingUser);
    }

    @Override
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public List<User> searchUsers(String keyword) {
        return userRepository.searchUsers(keyword);
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
            throw new RuntimeException("Erreur upload photo");
        }
    }


>>>>>>> f0c4e72 (url de front)
}