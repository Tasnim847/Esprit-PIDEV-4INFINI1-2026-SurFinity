package org.example.projet_pi.Service;

import org.example.projet_pi.Repository.AgentFinanceRepository;
import org.example.projet_pi.entity.AgentFinance;
import org.example.projet_pi.entity.Role;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AgentFinanceService implements IAgentFinanceService {

    private final AgentFinanceRepository agentFinanceRepository;

    public AgentFinanceService(AgentFinanceRepository agentFinanceRepository) {
        this.agentFinanceRepository = agentFinanceRepository;
    }

    @Override
    public AgentFinance addAgent(AgentFinance agentFinance) {

        agentFinance.setRole(Role.AGENT_FINANCE);

        return agentFinanceRepository.save(agentFinance);
    }

    @Override
    public AgentFinance updateAgent(AgentFinance agentFinance) {
        return agentFinanceRepository.save(agentFinance);
    }

    @Override
    public void deleteAgent(Long id) {
        agentFinanceRepository.deleteById(id);
    }

    @Override
    public AgentFinance getAgentById(Long id) {
        return agentFinanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agent not found"));
    }

    @Override
    public List<AgentFinance> getAllAgents() {
        return agentFinanceRepository.findAll();
    }
}
