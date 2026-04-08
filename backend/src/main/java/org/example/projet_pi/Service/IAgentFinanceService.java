package org.example.projet_pi.Service;

import org.example.projet_pi.entity.AgentFinance;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IAgentFinanceService {

    AgentFinance addAgent(AgentFinance agentFinance, MultipartFile photo);

    AgentFinance updateAgentById(Long id, AgentFinance agentFinance, MultipartFile photo);

    void deleteAgent(Long id);

    AgentFinance getAgentById(Long id);

    List<AgentFinance> getAllAgents();

    void changePassword(Long agentId, String oldPassword, String newPassword);
}