<<<<<<< HEAD
package org.example.projet_pi.Controller;

import lombok.RequiredArgsConstructor;
import org.example.projet_pi.Service.IAdminService;
import org.example.projet_pi.entity.Admin;
import org.example.projet_pi.entity.Role;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/admins")
@RequiredArgsConstructor
public class AdminController {

    private final IAdminService adminService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/add", consumes = "multipart/form-data")
    public Admin addAdmin(
            @RequestParam("firstName") String firstName,
            @RequestParam("lastName") String lastName,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("telephone") String telephone,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ) {
        Admin admin = new Admin();
        admin.setFirstName(firstName);
        admin.setLastName(lastName);
        admin.setEmail(email);
        admin.setPassword(password);
        admin.setTelephone(telephone);
        admin.setRole(Role.ADMIN);

        return adminService.addAdmin(admin, photo);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping(value = "/update/{id}", consumes = "multipart/form-data")
    public Admin updateAdmin(
            @PathVariable Long id,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) String telephone,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ) {
        Admin admin = new Admin();
        admin.setFirstName(firstName);
        admin.setLastName(lastName);
        admin.setEmail(email);
        admin.setPassword(password);
        admin.setTelephone(telephone);

        return adminService.updateAdminById(id, admin, photo);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete/{id}")
    public void deleteAdmin(@PathVariable Long id) {
        adminService.deleteAdmin(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public Admin getAdminById(@PathVariable Long id) {
        return adminService.getAdminById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public List<Admin> getAllAdmins() {
        return adminService.getAllAdmins();
    }
=======
package org.example.projet_pi.Controller;

import lombok.RequiredArgsConstructor;
import org.example.projet_pi.Service.IAdminService;
import org.example.projet_pi.entity.Admin;
import org.example.projet_pi.entity.Role;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/admins")
@RequiredArgsConstructor
public class AdminController {

    private final IAdminService adminService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/add", consumes = "multipart/form-data")
    public Admin addAdmin(
            @RequestParam("firstName") String firstName,
            @RequestParam("lastName") String lastName,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("telephone") String telephone,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ) {
        Admin admin = new Admin();
        admin.setFirstName(firstName);
        admin.setLastName(lastName);
        admin.setEmail(email);
        admin.setPassword(password);
        admin.setTelephone(telephone);
        admin.setRole(Role.ADMIN);

        return adminService.addAdmin(admin, photo);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping(value = "/update/{id}", consumes = "multipart/form-data")
    public Admin updateAdmin(
            @PathVariable Long id,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) String telephone,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ) {
        Admin admin = new Admin();
        admin.setFirstName(firstName);
        admin.setLastName(lastName);
        admin.setEmail(email);
        admin.setPassword(password);
        admin.setTelephone(telephone);

        return adminService.updateAdminById(id, admin, photo);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete/{id}")
    public void deleteAdmin(@PathVariable Long id) {
        adminService.deleteAdmin(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public Admin getAdminById(@PathVariable Long id) {
        return adminService.getAdminById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public List<Admin> getAllAdmins() {
        return adminService.getAllAdmins();
    }
>>>>>>> f0c4e72 (url de front)
}