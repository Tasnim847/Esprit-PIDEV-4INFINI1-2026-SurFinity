package org.example.projet_pi.Dto;

public class TransferByRipRequestDTO {
    private String sourceRip;
    private String targetRip;
    private Double amount;
    private String description;

    public TransferByRipRequestDTO() {}

    public TransferByRipRequestDTO(String sourceRip, String targetRip, Double amount, String description) {
        this.sourceRip = sourceRip;
        this.targetRip = targetRip;
        this.amount = amount;
        this.description = description;
    }

    // Getters et Setters
    public String getSourceRip() { return sourceRip; }
    public void setSourceRip(String sourceRip) { this.sourceRip = sourceRip; }
    public String getTargetRip() { return targetRip; }
    public void setTargetRip(String targetRip) { this.targetRip = targetRip; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}