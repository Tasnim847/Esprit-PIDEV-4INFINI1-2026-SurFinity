
package org.example.projet_pi.Controller;

import lombok.RequiredArgsConstructor;
import org.example.projet_pi.Dto.ChangePasswordRequest;
import org.example.projet_pi.Service.IAgentFinanceService;
import org.example.projet_pi.entity.AgentFinance;
import org.example.projet_pi.entity.Role;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/agents/finance")
@RequiredArgsConstructor
public class AgentFinanceController {

    private final IAgentFinanceService agentFinanceService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/add", consumes = "multipart/form-data")
    public AgentFinance addAgent(
            @RequestParam String firstName,
            @RequestParam String lastName,
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam String telephone,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ){
        AgentFinance agent = new AgentFinance();
        agent.setFirstName(firstName);
        agent.setLastName(lastName);
        agent.setEmail(email);
        agent.setPassword(password);
        agent.setTelephone(telephone);
        agent.setRole(Role.AGENT_FINANCE);

        return agentFinanceService.addAgent(agent, photo);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping(value = "/update/{id}", consumes = "multipart/form-data")
    public AgentFinance updateAgent(
            @PathVariable Long id,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) String telephone,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ){
        AgentFinance agent = new AgentFinance();
        agent.setFirstName(firstName);
        agent.setLastName(lastName);
        agent.setEmail(email);
        agent.setPassword(password);
        agent.setTelephone(telephone);

        return agentFinanceService.updateAgentById(id, agent, photo);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete/{id}")
    public void deleteAgent(@PathVariable Long id) {
        agentFinanceService.deleteAgent(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','AGENT_FINANCE')")
    @GetMapping("/{id}")
    public AgentFinance getAgentById(@PathVariable Long id) {
        return agentFinanceService.getAgentById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public List<AgentFinance> getAllAgents() {
        return agentFinanceService.getAllAgents();
    }

    @PreAuthorize("hasAnyRole('ADMIN','AGENT_FINANCE')")
    @GetMapping("/{id}/clients")
    public List<?> getClientsByAgent(@PathVariable Long id) {
        AgentFinance agent = agentFinanceService.getAgentById(id);
        return agent.getClients();
    }

    @PutMapping("/change-password")
    @PreAuthorize("hasAnyRole('ADMIN','AGENT_FINANCE')")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request){
        agentFinanceService.changePassword(request.getId(), request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok("Password changed successfully");
    }
}