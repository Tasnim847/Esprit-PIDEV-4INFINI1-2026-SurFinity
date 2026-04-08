package org.example.projet_pi.Service;

import org.example.projet_pi.Repository.NewsRepository;
import org.example.projet_pi.entity.News;
import org.example.projet_pi.entity.NewsStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class NewsService implements INewsService {

    private static final Logger logger = LoggerFactory.getLogger(NewsService.class);

    private final String UPLOAD_DIR = "uploads/news/";

    @Autowired  // ← AJOUTER CETTE ANNOTATION
    private NewsRepository newsRepository;  // ← Injection correcte

    // ==================== CRUD ====================

    @Override
    public News addNews(News news) {
        logger.info("Ajout d'une nouvelle news: {}", news.getTitle());

        if (news.getPublishDate() == null) {
            news.setPublishDate(new Date());
        }
        if (news.getViewCount() == null) {
            news.setViewCount(0L);
        }
        if (news.getStatus() == null) {
            news.setStatus(NewsStatus.DRAFT);
        }

        News savedNews = newsRepository.save(news);  // ← save() existe
        logger.info("News ajoutée avec succès avec l'ID: {}", savedNews.getNewsId());
        return savedNews;
    }

    @Override
    public News updateNews(News news) {
        logger.info("Mise à jour de la news avec l'ID: {}", news.getNewsId());

        if (!newsRepository.existsById(news.getNewsId())) {  // ← existsById() (pas existsByld)
            throw new RuntimeException("News non trouvée avec l'ID: " + news.getNewsId());
        }

        News updatedNews = newsRepository.save(news);  // ← save() existe
        logger.info("News mise à jour avec succès: {}", updatedNews.getNewsId());
        return updatedNews;
    }

    @Override
    public void deleteNews(Long id) {
        logger.info("Suppression de la news avec l'ID: {}", id);

        if (!newsRepository.existsById(id)) {  // ← existsById() (pas existsByld)
            throw new RuntimeException("News non trouvée avec l'ID: " + id);
        }

        newsRepository.deleteById(id);  // ← deleteById() (pas deleteByld)
        logger.info("News supprimée avec succès: {}", id);
    }

    @Override
    public News getNewsById(Long id) {
        logger.debug("Récupération de la news avec l'ID: {}", id);

        return newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News non trouvée avec l'ID: " + id));
    }

    @Override
    public Optional<News> findNewsById(Long id) {
        return newsRepository.findById(id);  // ← findById() existe
    }

    @Override
    public List<News> getAllNews() {
        logger.debug("Récupération de toutes les news");
        return newsRepository.findAll();  // ← findAll() existe
    }

    @Override
    public Page<News> getPagedNews(Pageable pageable) {
        logger.debug("Récupération paginée des news");
        return newsRepository.findAll(pageable);  // ← findAll(pageable) existe
    }

    // ==================== RECHERCHES ====================

    @Override
    public List<News> searchNewsByTitle(String keyword) {
        logger.debug("Recherche de news avec le mot-clé: {}", keyword);
        return newsRepository.searchByTitle(keyword);
    }

    @Override
    public List<News> getLatestNews(int limit) {
        logger.debug("Récupération des {} dernières news", limit);
        return newsRepository.findTop10ByOrderByPublishDateDesc();
    }

    @Override
    public List<News> getPublishedNews() {
        logger.debug("Récupération des news publiées");
        return newsRepository.findByStatus(NewsStatus.PUBLISHED);
    }

    @Override
    public News publishNews(Long id) {
        logger.info("Publication de la news avec l'ID: {}", id);

        News news = getNewsById(id);
        news.setStatus(NewsStatus.PUBLISHED);
        if (news.getPublishDate() == null) {
            news.setPublishDate(new Date());
        }

        return newsRepository.save(news);
    }

    @Override
    public News archiveNews(Long id) {
        logger.info("Archivage de la news avec l'ID: {}", id);

        News news = getNewsById(id);
        news.setStatus(NewsStatus.ARCHIVED);

        return newsRepository.save(news);
    }

    @Override
    public News incrementViewCount(Long id) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News non trouvée avec l'ID: " + id));

        news.setViewCount(news.getViewCount() + 1);
        return newsRepository.save(news);
    }

    // ==================== STATISTIQUES ====================

    @Override
    public boolean existsById(Long id) {
        return newsRepository.existsById(id);
    }

    @Override
    public long countAllNews() {
        return newsRepository.count();
    }

    @Override
    public long getPublishedNewsCount() {
        return newsRepository.countByStatus(NewsStatus.PUBLISHED);
    }

    // ==================== UPLOAD IMAGES ====================

    @Override
    public String uploadImage(Long newsId, MultipartFile file) {
        logger.info("Upload d'image pour la news ID: {}", newsId);

        News news = getNewsById(newsId);

        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("Le fichier doit être une image");
            }

            if (file.getSize() > 5 * 1024 * 1024) {
                throw new IllegalArgumentException("L'image ne doit pas dépasser 5MB");
            }

            String extension = "";
            String originalFilename = file.getOriginalFilename();
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + extension;

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            String imageUrl = "/uploads/news/" + fileName;
            news.setImageUrl(imageUrl);
            newsRepository.save(news);

            logger.info("Image uploadée avec succès: {}", imageUrl);
            return imageUrl;

        } catch (IOException e) {
            logger.error("Erreur lors de l'upload", e);
            throw new RuntimeException("Erreur lors du téléchargement de l'image", e);
        }
    }

    @Override
    public void deleteImage(Long newsId) {
        News news = getNewsById(newsId);
        news.setImageUrl(null);
        newsRepository.save(news);
        logger.info("Image supprimée avec succès");
    }

    // ==================== FILTRES ====================

    @Override
    public List<News> getNewsByCategory(String category) {
        logger.debug("Récupération des news par catégorie: {}", category);
        return newsRepository.findByCategory(category);
    }

    @Override
    public List<News> getNewsByAuthor(String author) {
        logger.debug("Récupération des news par auteur: {}", author);
        return newsRepository.findByAuthor(author);
    }

    @Override
    public List<News> getNewsByDateRange(Date startDate, Date endDate) {
        logger.debug("Récupération des news entre {} et {}", startDate, endDate);
        return newsRepository.findByPublishDateBetween(startDate, endDate);
    }

    @Override
    public List<News> getMostViewedNews(int limit) {
        logger.debug("Récupération des {} news les plus vues", limit);
        return newsRepository.findTop10ByOrderByViewCountDesc();
    }
}