package org.example.projet_pi.Service;

import org.example.projet_pi.entity.News;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface INewsService {

    // ==================== CRUD ====================
    News addNews(News news);
    News updateNews(News news);
    void deleteNews(Long id);
    News getNewsById(Long id);
    Optional<News> findNewsById(Long id);
    List<News> getAllNews();
    Page<News> getPagedNews(Pageable pageable);

    // ==================== RECHERCHES ====================
    List<News> searchNewsByTitle(String keyword);
    List<News> getLatestNews(int limit);
    List<News> getPublishedNews();
    List<News> getNewsByCategory(String category);
    List<News> getNewsByAuthor(String author);
    List<News> getNewsByDateRange(Date startDate, Date endDate);
    List<News> getMostViewedNews(int limit);

    // ==================== ACTIONS ====================
    News publishNews(Long id);
    News archiveNews(Long id);
    News incrementViewCount(Long id);

    boolean existsById(Long id);

    // ==================== STATISTIQUES ====================
    long countAllNews();
    long getPublishedNewsCount();

    // ==================== UPLOAD ====================
    String uploadImage(Long newsId, MultipartFile file);
    void deleteImage(Long newsId);
}