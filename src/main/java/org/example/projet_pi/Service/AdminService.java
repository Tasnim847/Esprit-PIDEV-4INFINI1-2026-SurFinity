package org.example.projet_pi.Service;

import org.example.projet_pi.Repository.AdminRepository;
import org.example.projet_pi.entity.Admin;
import org.example.projet_pi.entity.Role;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService implements IAdminService {

    private final AdminRepository adminRepository;

    public AdminService(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
    }

    @Override
    public Admin addAdmin(Admin admin) {
        admin.setRole(Role.ADMIN);
        return adminRepository.save(admin);
    }
    @Override
    public Admin updateAdmin(Admin admin) {
        return adminRepository.save(admin);
    }

    @Override
    public void deleteAdmin(Long id) {
        adminRepository.deleteById(id);
    }

    @Override
    public Admin getAdminById(Long id) {
        return adminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
    }

    @Override
    public List<Admin> getAllAdmins() {
        return adminRepository.findAll();
    }
}