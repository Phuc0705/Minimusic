-- ===== DATABASE SCHEMA CHO MINIMUSIC APP =====
-- Created for: Project Music - Web Development
-- Purpose: Hỗ trợ đồ án 3 môn (Web, Database, Mobile)

CREATE DATABASE IF NOT EXISTS minimusic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE minimusic_db;

-- ===== 1. BẢNG USERS (Người dùng) =====
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== 2. BẢNG PLAYLISTS (Danh sách phát) =====
CREATE TABLE IF NOT EXISTS playlists (
    playlist_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== 3. BẢNG FAVORITES/LIKES (Yêu thích) =====
CREATE TABLE IF NOT EXISTS likes (
    like_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    song_id VARCHAR(100) NOT NULL,
    song_title VARCHAR(255),
    artist_name VARCHAR(255),
    cover_art_url VARCHAR(500),
    file_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_song (user_id, song_id),
    INDEX idx_user_id (user_id),
    INDEX idx_song_id (song_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== 4. BẢNG PLAYLIST_TRACKS (Bài hát trong playlist) =====
CREATE TABLE IF NOT EXISTS playlist_tracks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_id INT NOT NULL,
    song_id VARCHAR(100) NOT NULL,
    song_title VARCHAR(255),
    artist_name VARCHAR(255),
    cover_art_url VARCHAR(500),
    file_url VARCHAR(500),
    position INT DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    INDEX idx_playlist_id (playlist_id),
    INDEX idx_song_id (song_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== 5. BẢNG HISTORY (Lịch sử nghe nhạc) =====
CREATE TABLE IF NOT EXISTS history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    song_id VARCHAR(100) NOT NULL,
    song_title VARCHAR(255),
    artist_name VARCHAR(255),
    cover_art_url VARCHAR(500),
    file_url VARCHAR(500),
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_played_at (played_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== 6. BẢNG RATINGS (Đánh giá bài hát) - Tùy chọn =====
CREATE TABLE IF NOT EXISTS ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    song_id VARCHAR(100) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_song_rating (user_id, song_id),
    INDEX idx_song_id (song_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== INSERT MỘT SỐ DỮ LIỆU MẪU (Tùy chọn) =====
-- Mật khẩu đã hash cho user test: password123
-- Password hash: $2a$10$8K1p/a0d99VqN3MkX1qPDOzYKC1XNF9Rb4P1mD3z2X5P5JF5X2P9q

-- User test
-- INSERT INTO users (username, email, password_hash) VALUES
-- ('testuser', 'test@example.com', '$2a$10$8K1p/a0d99VqN3MkX1qPDOzYKC1XNF9Rb4P1mD3z2X5P5JF5X2P9q');

COMMIT;

-- ===== KẾT THÚC SCHEMA =====
-- Để chạy file này:
-- mysql -u root -p < database_schema.sql
