// Service/AdminStatsService.java
package org.example.projet_pi.Service;

import lombok.RequiredArgsConstructor;
import org.example.projet_pi.Repository.*;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private final ClientRepository clientRepository;
    private final AgentAssuranceRepository agentAssuranceRepository;
    private final AgentFinanceRepository agentFinanceRepository;
    private final AdminRepository adminRepository;
    private final UserRepository userRepository;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Compter tous les utilisateurs par rôle
        long totalUsers = userRepository.count();
        long totalClients = clientRepository.count();
        long totalAgentsAssurance = agentAssuranceRepository.count();
        long totalAgentsFinance = agentFinanceRepository.count();
        long totalAdmins = adminRepository.count();

        stats.put("totalUsers", totalUsers);
        stats.put("totalClients", totalClients);
        stats.put("totalAgentsAssurance", totalAgentsAssurance);
        stats.put("totalAgentsFinance", totalAgentsFinance);
        stats.put("totalAdmins", totalAdmins);

        // Activités récentes (vous pouvez personnaliser)
        stats.put("recentActivities", getRecentActivities());

        return stats;
    }

    private List<String> getRecentActivities() {
        // Vous pouvez implémenter cette méthode pour retourner les activités récentes
        // Par exemple, depuis une table d'audit
        return List.of(
                "Dashboard consulté",
                "Système opérationnel"
        );
    }
}