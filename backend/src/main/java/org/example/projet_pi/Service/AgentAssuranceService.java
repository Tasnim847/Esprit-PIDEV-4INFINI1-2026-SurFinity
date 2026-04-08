<<<<<<< HEAD
package org.example.projet_pi.Service;

import lombok.RequiredArgsConstructor;
import org.example.projet_pi.Repository.AgentAssuranceRepository;
import org.example.projet_pi.entity.AgentAssurance;
import org.example.projet_pi.entity.Role;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgentAssuranceService implements IAgentAssuranceService {

    private final AgentAssuranceRepository agentAssuranceRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public AgentAssurance addAgent(AgentAssurance agentAssurance, MultipartFile photo) {
        agentAssurance.setRole(Role.AGENT_ASSURANCE);

        if(agentAssurance.getPassword() != null && !agentAssurance.getPassword().isEmpty()){
            agentAssurance.setPassword(passwordEncoder.encode(agentAssurance.getPassword()));
        }

        if(photo != null && !photo.isEmpty()){
            String fileName = uploadPhoto(photo);
            agentAssurance.setPhoto(fileName);
        }

        return agentAssuranceRepository.save(agentAssurance);
    }

    @Override
    public AgentAssurance updateAgentById(Long id, AgentAssurance agentAssurance, MultipartFile photo) {
        AgentAssurance existingAgent = agentAssuranceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agent Assurance not found"));

        if(agentAssurance.getFirstName() != null && !agentAssurance.getFirstName().isEmpty())
            existingAgent.setFirstName(agentAssurance.getFirstName());

        if(agentAssurance.getLastName() != null && !agentAssurance.getLastName().isEmpty())
            existingAgent.setLastName(agentAssurance.getLastName());

        if(agentAssurance.getEmail() != null && !agentAssurance.getEmail().isEmpty())
            existingAgent.setEmail(agentAssurance.getEmail());

        if(agentAssurance.getTelephone() != null && !agentAssurance.getTelephone().isEmpty())
            existingAgent.setTelephone(agentAssurance.getTelephone());

        if(agentAssurance.getPassword() != null && !agentAssurance.getPassword().isEmpty())
            existingAgent.setPassword(passwordEncoder.encode(agentAssurance.getPassword()));

        if(photo != null && !photo.isEmpty()){
            String fileName = uploadPhoto(photo);
            existingAgent.setPhoto(fileName);
        }

        existingAgent.setRole(Role.AGENT_ASSURANCE);
        return agentAssuranceRepository.save(existingAgent);
    }

    @Override
    public void deleteAgent(Long id) {
        agentAssuranceRepository.deleteById(id);
    }

    @Override
    public AgentAssurance getAgentById(Long id) {
        return agentAssuranceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agent Assurance not found"));
    }

    @Override
    public List<AgentAssurance> getAllAgents() {
        return agentAssuranceRepository.findAll();
    }

    @Override
    public void changePassword(Long agentId, String oldPassword, String newPassword) {
        AgentAssurance agent = agentAssuranceRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));

        if(!passwordEncoder.matches(oldPassword, agent.getPassword())){
            throw new RuntimeException("Old password incorrect");
        }

        agent.setPassword(passwordEncoder.encode(newPassword));
        agentAssuranceRepository.save(agent);
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
import org.example.projet_pi.Repository.AgentAssuranceRepository;
import org.example.projet_pi.entity.AgentAssurance;
import org.example.projet_pi.entity.Role;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgentAssuranceService implements IAgentAssuranceService {

    private final AgentAssuranceRepository agentAssuranceRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public AgentAssurance addAgent(AgentAssurance agentAssurance, MultipartFile photo) {
        agentAssurance.setRole(Role.AGENT_ASSURANCE);

        if(agentAssurance.getPassword() != null && !agentAssurance.getPassword().isEmpty()){
            agentAssurance.setPassword(passwordEncoder.encode(agentAssurance.getPassword()));
        }

        if(photo != null && !photo.isEmpty()){
            String fileName = uploadPhoto(photo);
            agentAssurance.setPhoto(fileName);
        }

        return agentAssuranceRepository.save(agentAssurance);
    }

    @Override
    public AgentAssurance updateAgentById(Long id, AgentAssurance agentAssurance, MultipartFile photo) {
        AgentAssurance existingAgent = agentAssuranceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agent Assurance not found"));

        if(agentAssurance.getFirstName() != null && !agentAssurance.getFirstName().isEmpty())
            existingAgent.setFirstName(agentAssurance.getFirstName());

        if(agentAssurance.getLastName() != null && !agentAssurance.getLastName().isEmpty())
            existingAgent.setLastName(agentAssurance.getLastName());

        if(agentAssurance.getEmail() != null && !agentAssurance.getEmail().isEmpty())
            existingAgent.setEmail(agentAssurance.getEmail());

        if(agentAssurance.getTelephone() != null && !agentAssurance.getTelephone().isEmpty())
            existingAgent.setTelephone(agentAssurance.getTelephone());

        if(agentAssurance.getPassword() != null && !agentAssurance.getPassword().isEmpty())
            existingAgent.setPassword(passwordEncoder.encode(agentAssurance.getPassword()));

        if(photo != null && !photo.isEmpty()){
            String fileName = uploadPhoto(photo);
            existingAgent.setPhoto(fileName);
        }

        existingAgent.setRole(Role.AGENT_ASSURANCE);
        return agentAssuranceRepository.save(existingAgent);
    }

    @Override
    public void deleteAgent(Long id) {
        agentAssuranceRepository.deleteById(id);
    }

    @Override
    public AgentAssurance getAgentById(Long id) {
        return agentAssuranceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agent Assurance not found"));
    }

    @Override
    public List<AgentAssurance> getAllAgents() {
        return agentAssuranceRepository.findAll();
    }

    @Override
    public void changePassword(Long agentId, String oldPassword, String newPassword) {
        AgentAssurance agent = agentAssuranceRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));

        if(!passwordEncoder.matches(oldPassword, agent.getPassword())){
            throw new RuntimeException("Old password incorrect");
        }

        agent.setPassword(passwordEncoder.encode(newPassword));
        agentAssuranceRepository.save(agent);
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