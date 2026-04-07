package org.example.projet_pi.entity;

public enum NewsStatus {
    DRAFT("Brouillon"),
    PUBLISHED("Publié"),
    ARCHIVED("Archivé");

    private final String label;

    NewsStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}