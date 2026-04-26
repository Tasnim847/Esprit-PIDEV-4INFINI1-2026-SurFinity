package org.example.projet_pi.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Entity
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long accountId;

    private double balance;

    @Enumerated(EnumType.STRING)
    private AccountType type;

    private String status;

    @ManyToOne
    private Client client;

    // 🔹 Limite quotidienne de retrait
    private double dailyLimit;

    // 🔹 Limite mensuelle de retrait
    private double monthlyLimit;

    // 🆕 RIP (Relevé d'Identité Permanent) - 24 caractères unique
    @Column(unique = true, nullable = false, length = 24)
    private String rip;

    // 🆕 Limite quotidienne de virement (différente des retraits)
    private double dailyTransferLimit;

    // 🆕 Date de création
    private LocalDateTime createdAt;

    // 🆕 Date de dernière modification
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Transaction> transactions;

    // ============================================================
    // CONSTRUCTEURS
    // ============================================================

    // Constructeur par défaut (pour JPA)
    public Account() {
        // NE PAS initialiser dailyLimit, monthlyLimit ici
        // Elles seront définies par l'ADMIN ou via setters
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        // dailyTransferLimit a une valeur par défaut raisonnable
        this.dailyTransferLimit = 5000;
    }

    // 🆕 Constructeur pour création ADMIN (compatible avec votre code existant)
    public Account(double balance, AccountType type, String status, Client client) {
        this();
        this.balance = balance;
        this.type = type;
        this.status = status;
        this.client = client;
        // dailyLimit et monthlyLimit seront settés séparément par l'ADMIN
    }

    // 🆕 Constructeur pour demande de compte (CLIENT)
    public Account(Client client, AccountType type) {
        this();
        this.client = client;
        this.type = type;
        this.balance = 0.0;
        this.status = "PENDING";  // En attente de validation par agent
        // Limites par défaut pour une demande (seront modifiées par l'agent)
        this.dailyLimit = 0;      // 0 = pas de limite (à configurer par agent)
        this.monthlyLimit = 0;    // 0 = pas de limite
    }

    // ============================================================
    // GETTERS ET SETTERS
    // ============================================================

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }

    public double getBalance() {
        return balance;
    }

    public void setBalance(double balance) {
        this.balance = balance;
    }

    public AccountType getType() {
        return type;
    }

    public void setType(AccountType type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public List<Transaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<Transaction> transactions) {
        this.transactions = transactions;
    }

    public double getDailyLimit() {
        return dailyLimit;
    }

    public void setDailyLimit(double dailyLimit) {
        this.dailyLimit = dailyLimit;
    }

    public double getMonthlyLimit() {
        return monthlyLimit;
    }

    public void setMonthlyLimit(double monthlyLimit) {
        this.monthlyLimit = monthlyLimit;
    }

    public String getRip() {
        return rip;
    }

    public void setRip(String rip) {
        this.rip = rip;
    }

    public double getDailyTransferLimit() {
        return dailyTransferLimit;
    }

    public void setDailyTransferLimit(double dailyTransferLimit) {
        this.dailyTransferLimit = dailyTransferLimit;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // ============================================================
    // MÉTHODES AUTOMATIQUES (JPA Lifecycle Callbacks)
    // ============================================================

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.rip == null || this.rip.isEmpty()) {
            this.rip = generateRip();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ============================================================
    // GÉNÉRATION DU RIP
    // ============================================================

    private String generateRip() {
        String bankCode = "10000";
        String branchCode = String.format("%05d", new Random().nextInt(100000));

        long timestamp = System.currentTimeMillis();
        // Utiliser l'ID si disponible, sinon timestamp
        long uniqueNum = (this.accountId != null ? this.accountId : timestamp) % 1000000000L;
        String accountNumber = String.format("%09d", uniqueNum);

        String ribBase = bankCode + branchCode + accountNumber;
        int key = computeRibKey(ribBase);
        String keyStr = String.format("%02d", key);

        return bankCode + branchCode + accountNumber + keyStr;
    }

    private int computeRibKey(String ribBase) {
        try {
            long number = Long.parseLong(ribBase);
            int remainder = (int) (number % 97);
            return 97 - remainder;
        } catch (NumberFormatException e) {
            return 88;
        }
    }

    // ============================================================
    // MÉTHODES UTILITAIRES
    // ============================================================

    public boolean canPerformTransaction() {
        return "ACTIVE".equals(this.status);
    }

    public boolean canReceiveMoney() {
        return !"BLOCKED".equals(this.status);
    }

    @Override
    public String toString() {
        return "Account{" +
                "accountId=" + accountId +
                ", rip='" + rip + '\'' +
                ", balance=" + balance +
                ", type=" + type +
                ", status='" + status + '\'' +
                '}';
    }
}