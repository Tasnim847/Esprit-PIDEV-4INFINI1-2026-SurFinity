<<<<<<< HEAD
package org.example.projet_pi.Service;

import org.example.projet_pi.entity.AgentAssurance;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IAgentAssuranceService {

    AgentAssurance addAgent(AgentAssurance agentAssurance, MultipartFile photo);

    AgentAssurance updateAgentById(Long id, AgentAssurance agentAssurance, MultipartFile photo);

    void deleteAgent(Long id);

    AgentAssurance getAgentById(Long id);

    List<AgentAssurance> getAllAgents();

    void changePassword(Long agentId, String oldPassword, String newPassword);
=======
package org.example.projet_pi.Service;

import org.example.projet_pi.entity.AgentAssurance;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IAgentAssuranceService {

    AgentAssurance addAgent(AgentAssurance agentAssurance, MultipartFile photo);

    AgentAssurance updateAgentById(Long id, AgentAssurance agentAssurance, MultipartFile photo);

    void deleteAgent(Long id);

    AgentAssurance getAgentById(Long id);

    List<AgentAssurance> getAllAgents();

    void changePassword(Long agentId, String oldPassword, String newPassword);
>>>>>>> f0c4e72 (url de front)
}