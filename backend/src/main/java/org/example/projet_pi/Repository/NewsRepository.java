package org.example.projet_pi.Repository;

import org.example.projet_pi.entity.News;
import org.example.projet_pi.entity.NewsStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface NewsRepository extends JpaRepository<News, Long> {

    // ========== MÉTHODES DE BASE (héritées de JpaRepository) ==========
    // Les méthodes suivantes existent déjà:
    // - save(News news)
    // - findById(Long id)
    // - findAll()
    // - findAll(Pageable pageable)
    // - existsById(Long id)
    // - deleteById(Long id)
    // - count()

    // ========== MÉTHODES PERSONNALISÉES ==========

    // Recherche par statut
    List<News> findByStatus(NewsStatus status);

    // Recherche par catégorie
    List<News> findByCategory(String category);

    // Recherche par auteur
    List<News> findByAuthor(String author);

    // Recherche par plage de dates
    List<News> findByPublishDateBetween(Date startDate, Date endDate);

    // Recherche par titre (mot-clé)
    @Query("SELECT n FROM News n WHERE LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<News> searchByTitle(@Param("keyword") String keyword);

    // Les 10 dernières news par date
    List<News> findTop10ByOrderByPublishDateDesc();

    // Les 10 news les plus vues
    List<News> findTop10ByOrderByViewCountDesc();

    // Compter par statut
    long countByStatus(NewsStatus status);
}