<<<<<<< HEAD
package org.example.projet_pi.Service;

import org.example.projet_pi.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IUserService {

    User addUser(User user, MultipartFile photo);

    void deleteUser(Long id);

    User getUserById(Long id);

    List<User> getAllUsers();

    User updateUserById(Long id, User user, MultipartFile photo);

    List<User> searchUsers(String keyword);
=======
package org.example.projet_pi.Service;

import org.example.projet_pi.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IUserService {

    User addUser(User user, MultipartFile photo);

    void deleteUser(Long id);

    User getUserById(Long id);

    List<User> getAllUsers();

    User updateUserById(Long id, User user, MultipartFile photo);

    List<User> searchUsers(String keyword);
>>>>>>> f0c4e72 (url de front)
}