package org.example.projet_pi.Dto;

import org.example.projet_pi.entity.AccountType;

public class CreateAccountRequestDTO {
    private AccountType type;

    public CreateAccountRequestDTO() {}

    public CreateAccountRequestDTO(AccountType type) {
        this.type = type;
    }

    public AccountType getType() { return type; }
    public void setType(AccountType type) { this.type = type; }
}