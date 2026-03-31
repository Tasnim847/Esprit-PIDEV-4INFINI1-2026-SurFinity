package org.example.projet_pi.Dto;

import java.util.List;
import java.util.Map;

public class StatsDashboardDTO {

    // Statistiques globales
    private long totalActualites;
    private long totalVues;
    private double moyenneVuesParActualite;
    private long actualitesPubliees;
    private long actualitesBrouillon;
    private long actualitesArchivees;

    // Top actualités
    private List<TopActualiteDTO> topActualitesLesPlusVues;
    private List<TopActualiteDTO> topActualitesLesMieuxNotees;

    // Évolution par mois
    private List<EvolutionMensuelleDTO> evolutionParMois;

    // Auteur le plus actif
    private AuteurActifDTO auteurLePlusActif;

    // Statistiques par catégorie
    private Map<String, Long> statistiquesParCategorie;

    // Getters et Setters
    public static class TopActualiteDTO {
        private Long id;
        private String titre;
        private long vues;
        private String auteur;
        private double noteMoyenne;

        // Getters et Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getTitre() { return titre; }
        public void setTitre(String titre) { this.titre = titre; }
        public long getVues() { return vues; }
        public void setVues(long vues) { this.vues = vues; }
        public String getAuteur() { return auteur; }
        public void setAuteur(String auteur) { this.auteur = auteur; }
        public double getNoteMoyenne() { return noteMoyenne; }
        public void setNoteMoyenne(double noteMoyenne) { this.noteMoyenne = noteMoyenne; }
    }

    public static class EvolutionMensuelleDTO {
        private String mois;
        private long nombre;

        public EvolutionMensuelleDTO(String mois, long nombre) {
            this.mois = mois;
            this.nombre = nombre;
        }

        // Getters et Setters
        public String getMois() { return mois; }
        public void setMois(String mois) { this.mois = mois; }
        public long getNombre() { return nombre; }
        public void setNombre(long nombre) { this.nombre = nombre; }
    }

    public static class AuteurActifDTO {
        private String nom;
        private long nombreArticles;

        // Getters et Setters
        public String getNom() { return nom; }
        public void setNom(String nom) { this.nom = nom; }
        public long getNombreArticles() { return nombreArticles; }
        public void setNombreArticles(long nombreArticles) { this.nombreArticles = nombreArticles; }
    }

    // Getters et Setters principaux
    public long getTotalActualites() { return totalActualites; }
    public void setTotalActualites(long totalActualites) { this.totalActualites = totalActualites; }

    public long getTotalVues() { return totalVues; }
    public void setTotalVues(long totalVues) { this.totalVues = totalVues; }

    public double getMoyenneVuesParActualite() { return moyenneVuesParActualite; }
    public void setMoyenneVuesParActualite(double moyenneVuesParActualite) {
        this.moyenneVuesParActualite = moyenneVuesParActualite;
    }

    public long getActualitesPubliees() { return actualitesPubliees; }
    public void setActualitesPubliees(long actualitesPubliees) { this.actualitesPubliees = actualitesPubliees; }

    public long getActualitesBrouillon() { return actualitesBrouillon; }
    public void setActualitesBrouillon(long actualitesBrouillon) { this.actualitesBrouillon = actualitesBrouillon; }

    public long getActualitesArchivees() { return actualitesArchivees; }
    public void setActualitesArchivees(long actualitesArchivees) { this.actualitesArchivees = actualitesArchivees; }

    public List<TopActualiteDTO> getTopActualitesLesPlusVues() { return topActualitesLesPlusVues; }
    public void setTopActualitesLesPlusVues(List<TopActualiteDTO> topActualitesLesPlusVues) {
        this.topActualitesLesPlusVues = topActualitesLesPlusVues;
    }

    public List<TopActualiteDTO> getTopActualitesLesMieuxNotees() { return topActualitesLesMieuxNotees; }
    public void setTopActualitesLesMieuxNotees(List<TopActualiteDTO> topActualitesLesMieuxNotees) {
        this.topActualitesLesMieuxNotees = topActualitesLesMieuxNotees;
    }

    public List<EvolutionMensuelleDTO> getEvolutionParMois() { return evolutionParMois; }
    public void setEvolutionParMois(List<EvolutionMensuelleDTO> evolutionParMois) {
        this.evolutionParMois = evolutionParMois;
    }

    public AuteurActifDTO getAuteurLePlusActif() { return auteurLePlusActif; }
    public void setAuteurLePlusActif(AuteurActifDTO auteurLePlusActif) {
        this.auteurLePlusActif = auteurLePlusActif;
    }

    public Map<String, Long> getStatistiquesParCategorie() { return statistiquesParCategorie; }
    public void setStatistiquesParCategorie(Map<String, Long> statistiquesParCategorie) {
        this.statistiquesParCategorie = statistiquesParCategorie;
    }
}