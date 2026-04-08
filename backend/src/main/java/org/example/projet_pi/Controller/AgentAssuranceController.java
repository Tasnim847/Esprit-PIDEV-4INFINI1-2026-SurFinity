<<<<<<< HEAD
package org.example.projet_pi.Controller;

import lombok.RequiredArgsConstructor;
import org.example.projet_pi.Dto.ChangePasswordRequest;
import org.example.projet_pi.Service.IAgentAssuranceService;
import org.example.projet_pi.entity.AgentAssurance;
import org.example.projet_pi.entity.Role;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/agents-assurance")
@RequiredArgsConstructor
public class AgentAssuranceController {

    private final IAgentAssuranceService agentAssuranceService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/add", consumes = "multipart/form-data")
    public AgentAssurance addAgent(
            @RequestParam("firstName") String firstName,
            @RequestParam("lastName") String lastName,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("telephone") String telephone,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ) {
        AgentAssurance agent = new AgentAssurance();
        agent.setFirstName(firstName);
        agent.setLastName(lastName);
        agent.setEmail(email);
        agent.setPassword(password);
        agent.setTelephone(telephone);
        agent.setRole(Role.AGENT_ASSURANCE);

        return agentAssuranceService.addAgent(agent, photo);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping(value = "/update/{id}", consumes = "multipart/form-data")
    public AgentAssurance updateAgent(
            @PathVariable Long id,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) String telephone,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ) {
        AgentAssurance agent = new AgentAssurance();
        agent.setFirstName(firstName);
        agent.setLastName(lastName);
        agent.setEmail(email);
        agent.setPassword(password);
        agent.setTelephone(telephone);

        return agentAssuranceService.updateAgentById(id, agent, photo);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete/{id}")
    public void deleteAgent(@PathVariable Long id) {
        agentAssuranceService.deleteAgent(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','AGENT_ASSURANCE')")
    @GetMapping("/{id}")
    public AgentAssurance getAgentById(@PathVariable Long id) {
        return agentAssuranceService.getAgentById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public List<AgentAssurance> getAllAgents() {
        return agentAssuranceService.getAllAgents();
    }

    @PutMapping("/change-password")
    @PreAuthorize("hasAnyRole('ADMIN','AGENT_ASSURANCE')")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request){
        agentAssuranceService.changePassword(request.getId(), request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok("Password changed successfully");
    }
=======
package org.example.projet_pi.Controller;

import lombok.RequiredArgsConstructor;
import org.example.projet_pi.Dto.ChangePasswordRequest;
import org.example.projet_pi.Service.IAgentAssuranceService;
import org.example.projet_pi.entity.AgentAssurance;
import org.example.projet_pi.entity.Role;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/agents-assurance")
@RequiredArgsConstructor
public class AgentAssuranceController {

    private final IAgentAssuranceService agentAssuranceService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/add", consumes = "multipart/form-data")
    public AgentAssurance addAgent(
            @RequestParam("firstName") String firstName,
            @RequestParam("lastName") String lastName,
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("telephone") String telephone,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ) {
        AgentAssurance agent = new AgentAssurance();
        agent.setFirstName(firstName);
        agent.setLastName(lastName);
        agent.setEmail(email);
        agent.setPassword(password);
        agent.setTelephone(telephone);
        agent.setRole(Role.AGENT_ASSURANCE);

        return agentAssuranceService.addAgent(agent, photo);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping(value = "/update/{id}", consumes = "multipart/form-data")
    public AgentAssurance updateAgent(
            @PathVariable Long id,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) String telephone,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ) {
        AgentAssurance agent = new AgentAssurance();
        agent.setFirstName(firstName);
        agent.setLastName(lastName);
        agent.setEmail(email);
        agent.setPassword(password);
        agent.setTelephone(telephone);

        return agentAssuranceService.updateAgentById(id, agent, photo);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete/{id}")
    public void deleteAgent(@PathVariable Long id) {
        agentAssuranceService.deleteAgent(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','AGENT_ASSURANCE')")
    @GetMapping("/{id}")
    public AgentAssurance getAgentById(@PathVariable Long id) {
        return agentAssuranceService.getAgentById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/all")
    public List<AgentAssurance> getAllAgents() {
        return agentAssuranceService.getAllAgents();
    }

    @PutMapping("/change-password")
    @PreAuthorize("hasAnyRole('ADMIN','AGENT_ASSURANCE')")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request){
        agentAssuranceService.changePassword(request.getId(), request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok("Password changed successfully");
    }
>>>>>>> f0c4e72 (url de front)
}