package org.example.projet_pi.Repository;

import org.example.projet_pi.entity.Account;
import org.example.projet_pi.entity.AccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    // Récupérer les comptes d'un client spécifique
    List<Account> findByClientId(Long clientId);

    // Récupérer les comptes selon leur statut
    List<Account> findByStatus(String status);

    // 🆕 Récupérer un compte par son RIP (unique)
    Optional<Account> findByRip(String rip);

    // 🆕 Vérifier si un RIP existe déjà
    boolean existsByRip(String rip);

    // 🆕 Compter les comptes d'un client
    long countByClientId(Long clientId);

    // 🆕 Trouver les comptes actifs d'un client
    List<Account> findByClientIdAndStatus(Long clientId, String status);

    // 🆕 Rechercher les comptes par type
    List<Account> findByType(AccountType type);

    // 🆕 Rechercher par RIP et client (sécurité renforcée)
    Optional<Account> findByRipAndClientId(String rip, Long clientId);
}