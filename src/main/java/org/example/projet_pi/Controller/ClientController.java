package org.example.projet_pi.Controller;

import org.example.projet_pi.Service.IClientService;
import org.example.projet_pi.entity.Client;
import org.example.projet_pi.entity.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clients")
public class ClientController {

    @Autowired
    private IClientService clientService;

    // Ajouter un client
    @PostMapping("/add")
    public Client addClient(@RequestBody Client client) {
        return clientService.addClient(client);
    }

    // Modifier un client
    @PutMapping("/update/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CLIENT') and (#id == authentication.principal.id or hasRole('ADMIN'))")
    public Client updateClient(
            @PathVariable Long id,
            @RequestBody Client client){
        return clientService.updateClientInfo(id, client);
    }

    // Supprimer un client
    @DeleteMapping("/delete/{id}")
    public void deleteClient(@PathVariable Long id) {
        clientService.deleteClient(id);
    }

    // Récupérer un client par ID
    @GetMapping("/{id}")
    public Client getClientById(@PathVariable Long id) {
        return clientService.getClientById(id);
    }

    // Récupérer tous les clients
    @GetMapping("/all")
    public List<Client> getAllClients() {
        return clientService.getAllClients();
    }

    // Récupérer les clients d’un Agent Finance
    @GetMapping("/finance/{agentId}")
    public List<Client> getClientsByAgentFinance(@PathVariable Long agentId) {
        return clientService.getClientsByAgentFinance(agentId);
    }

    // Récupérer les clients d’un Agent Assurance
    @GetMapping("/assurance/{agentId}")
    public List<Client> getClientsByAgentAssurance(@PathVariable Long agentId) {
        return clientService.getClientsByAgentAssurance(agentId);
    }
}
