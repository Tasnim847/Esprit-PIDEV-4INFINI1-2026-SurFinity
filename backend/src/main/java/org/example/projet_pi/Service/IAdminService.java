<<<<<<< HEAD
package org.example.projet_pi.Service;

import org.example.projet_pi.entity.Admin;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IAdminService {

    Admin addAdmin(Admin admin, MultipartFile photo);

    Admin updateAdminById(Long id, Admin admin, MultipartFile photo);

    void deleteAdmin(Long id);

    Admin getAdminById(Long id);

    List<Admin> getAllAdmins();
=======
package org.example.projet_pi.Service;

import org.example.projet_pi.entity.Admin;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IAdminService {

    Admin addAdmin(Admin admin, MultipartFile photo);

    Admin updateAdminById(Long id, Admin admin, MultipartFile photo);

    void deleteAdmin(Long id);

    Admin getAdminById(Long id);

    List<Admin> getAllAdmins();
>>>>>>> f0c4e72 (url de front)
}