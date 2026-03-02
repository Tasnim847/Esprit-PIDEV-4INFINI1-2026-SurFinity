package org.example.projet_pi.Service;

import org.example.projet_pi.Repository.ClientRepository;
import org.example.projet_pi.entity.Client;
import org.example.projet_pi.entity.Role;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClientService implements IClientService {

    private final ClientRepository clientRepository;

    // Injection via constructeur
    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    @Override
    public Client addClient(Client client) {

        client.setRole(Role.CLIENT);
        return clientRepository.save(client);
    }

    @Override
    public Client updateClientInfo(Long id, Client clientRequest){

        Client existingClient = clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        if(clientRequest.getFirstName()!=null)
            existingClient.setFirstName(clientRequest.getFirstName());

        if(clientRequest.getLastName()!=null)
            existingClient.setLastName(clientRequest.getLastName());

        if(clientRequest.getEmail()!=null)
            existingClient.setEmail(clientRequest.getEmail());

        if(clientRequest.getTelephone()!=null)
            existingClient.setTelephone(clientRequest.getTelephone());
        if(clientRequest.getPassword()!=null){
            throw new RuntimeException("Password update not allowed here");
        }

        return clientRepository.save(existingClient);
    }

    @Override
    public void deleteClient(Long id) {
        if (!clientRepository.existsById(id)) {
            throw new RuntimeException("Client not found");
        }
        clientRepository.deleteById(id);
    }

    @Override
    public Client getClientById(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Client not found"));
    }

    @Override
    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    @Override
    public List<Client> getClientsByAgentFinance(Long agentFinanceId) {
        return clientRepository.findByAgentFinanceId(agentFinanceId);
    }

    @Override
    public List<Client> getClientsByAgentAssurance(Long agentAssuranceId) {
        return clientRepository.findByAgentAssuranceId(agentAssuranceId);
    }
}
