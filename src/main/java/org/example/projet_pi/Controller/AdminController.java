package org.example.projet_pi.Controller;

import org.example.projet_pi.Service.IAdminService;
import org.example.projet_pi.entity.Admin;
import org.example.projet_pi.entity.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admins")
public class AdminController {

    @Autowired
    private IAdminService adminService;

    // Ajouter un admin
    @PostMapping("/add")
    public Admin addAdmin(@RequestBody Admin admin) {
        return adminService.addAdmin(admin);
    }

    // Modifier un admin
    @PutMapping("/update")
    public Admin updateAdmin(@RequestBody Admin admin) {
        admin.setRole(Role.ADMIN);
        return adminService.updateAdmin(admin);
    }

    // Supprimer un admin
    @DeleteMapping("/delete/{id}")
    public void deleteAdmin(@PathVariable Long id) {
        adminService.deleteAdmin(id);
    }

    // Récupérer un admin par ID
    @GetMapping("/{id}")
    public Admin getAdminById(@PathVariable Long id) {
        return adminService.getAdminById(id);
    }

    // Récupérer tous les admins
    @GetMapping("/all")
    public List<Admin> getAllAdmins() {
        return adminService.getAllAdmins();
    }
}