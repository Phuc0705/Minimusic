const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios"); // Chỉ cần axios

const app = express();
const port = 3001;

// ===== MIDDLEWARE & CẤU HÌNH (Giữ nguyên) =====
app.use(express.json());
app.use(cors());

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "Namphuc2005.", // Mật khẩu của bạn
  database: "minimusic_db",
};
let pool;
const JWT_SECRET = "mysecretkey123";

// ===== HÀM KẾT NỐI DB =====
async function connectToDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log("Đã kết nối thành công với MySQL!");
  } catch (error) {
    console.error("Lỗi kết nối MySQL:", error);
  }
}

// ===== MIDDLEWARE XÁC THỰC =====
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ===== CÁC API =====

// 1. API Đăng ký
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: "Vui lòng nhập đủ thông tin." });
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, password_hash]
    );
    res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY")
      return res
        .status(400)
        .json({ message: "Email hoặc Username đã tồn tại." });
    console.error(error);
    res.status(500).json({ message: "Lỗi từ server" });
  }
});
// 2. API Đăng nhập
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Vui lòng nhập email và mật khẩu." });
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không đúng." });
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không đúng." });
    const payload = { userId: user.user_id, username: user.username };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Đăng nhập thành công!", token: token, user: payload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});
// 3. API LẤY BÀI HÁT (JAMENDO - 100% CHẠY)
app.get("/api/songs/popular", async (req, res) => {
  try {
    const CLIENT_ID = "a9315bea"; // Chìa khóa của bạn
    const JAMENDO_API = `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&limit=20&order=releasedate_desc`; // Lấy nhạc mới nhất

    console.log("...Đang chuẩn bị gọi JAMENDO...");
    const response = await axios.get(JAMENDO_API);
    console.log("...Đã gọi JAMENDO thành công!");

    const data = response.data;

    if (data.headers.status !== "success") {
      return res
        .status(500)
        .json({ message: "Không thể lấy dữ liệu từ Jamendo" });
    }

    const songs = data.results.map((item) => ({
      song_id: item.id, // Dùng ID của Jamendo
      title: item.name,
      artist_name: item.artist_name,
      cover_art_url: item.image, // Link ảnh bìa xịn
      file_url: item.audio, // Link .mp3 phát được ngay!
    }));

    res.json(songs);
  } catch (error) {
    console.error("Lỗi khi gọi Jamendo:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
});
// 4. API TÌM KIẾM BÀI HÁT (Sử dụng Jamendo)
app.get("/api/search", async (req, res) => {
  try {
    // Lấy từ khóa tìm kiếm từ URL: /api/search?q=từ_khóa
    const searchQuery = req.query.q; 
    
    if (!searchQuery) {
        return res.status(400).json({ message: "Vui lòng nhập từ khóa tìm kiếm." });
    }

    const CLIENT_ID = "a9315bea"; // Chìa khóa Jamendo của bạn
    // Gọi API Jamendo search
    const JAMENDO_SEARCH_API = `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=jsonpretty&limit=20&search=${searchQuery}&order=relevance`;
    
    console.log(`...Đang tìm kiếm với từ khóa: ${searchQuery}`);
    const response = await axios.get(JAMENDO_SEARCH_API);
    
    if (response.data.headers.status !== 'success') {
      return res.status(500).json({ message: 'Lỗi khi tìm kiếm trên Jamendo.' });
    }

    const songs = response.data.results.map(item => ({
      song_id: item.id,
      title: item.name,
      artist_name: item.artist_name,
      cover_art_url: item.image,
      file_url: item.audio // Link .mp3 phát được ngay
    }));
    
    res.json(songs);

  } catch (error) {
    console.error("Lỗi khi tìm kiếm:", error.message);
    res.status(500).json({ message: 'Lỗi server (tìm kiếm)' });
  }
});
// 4. API LẤY PLAYLIST CỦA TÔI
app.get("/api/my-playlists", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [playlists] = await pool.query(
      "SELECT playlist_id, name FROM playlists WHERE user_id = ?",
      [userId]
    );
    res.json(playlists);
  } catch (error) {
    console.error("Lỗi khi lấy playlist:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});
// 5. API TẠO PLAYLIST MỚI
app.post("/api/playlists", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Vui lòng nhập tên playlist" });
    const userId = req.user.userId;
    const [result] = await pool.query(
      "INSERT INTO playlists (name, user_id) VALUES (?, ?)",
      [name, userId]
    );
    res
      .status(201)
      .json({
        message: "Tạo playlist thành công!",
        playlistId: result.insertId,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 6. API THÊM BÀI HÁT VÀO PLAYLIST
app.post("/api/playlists/:playlistId/songs", authenticateToken, async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.user.userId;
    const { song_id, song_title, artist_name, cover_art_url, file_url } = req.body;

    // Kiểm tra playlist có thuộc user này không
    const [playlists] = await pool.query(
      "SELECT playlist_id FROM playlists WHERE playlist_id = ? AND user_id = ?",
      [playlistId, userId]
    );
    
    if (playlists.length === 0) {
      return res.status(404).json({ message: "Playlist không tồn tại" });
    }

    await pool.query(
      "INSERT INTO playlist_tracks (playlist_id, song_id, song_title, artist_name, cover_art_url, file_url) VALUES (?, ?, ?, ?, ?, ?)",
      [playlistId, song_id, song_title, artist_name, cover_art_url, file_url]
    );

    res.status(201).json({ message: "Thêm bài hát vào playlist thành công!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 7. API LẤY DANH SÁCH BÀI HÁT TRONG PLAYLIST
app.get("/api/playlists/:playlistId/songs", authenticateToken, async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.user.userId;

    // Kiểm tra playlist có thuộc user này không
    const [playlists] = await pool.query(
      "SELECT playlist_id FROM playlists WHERE playlist_id = ? AND user_id = ?",
      [playlistId, userId]
    );
    
    if (playlists.length === 0) {
      return res.status(404).json({ message: "Playlist không tồn tại" });
    }

    const [songs] = await pool.query(
      "SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY position ASC, added_at ASC",
      [playlistId]
    );

    res.json(songs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 8. API THÊM/XÓA YÊU THÍCH
app.post("/api/likes", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { song_id, song_title, artist_name, cover_art_url, file_url } = req.body;

    await pool.query(
      "INSERT INTO likes (user_id, song_id, song_title, artist_name, cover_art_url, file_url) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, song_id, song_title, artist_name, cover_art_url, file_url]
    );

    res.status(201).json({ message: "Thêm vào yêu thích thành công!" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Bài hát đã có trong yêu thích" });
    }
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.delete("/api/likes/:songId", authenticateToken, async (req, res) => {
  try {
    const { songId } = req.params;
    const userId = req.user.userId;

    await pool.query(
      "DELETE FROM likes WHERE user_id = ? AND song_id = ?",
      [userId, songId]
    );

    res.json({ message: "Xóa khỏi yêu thích thành công!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.get("/api/likes", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [likes] = await pool.query(
      "SELECT * FROM likes WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.json(likes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 9. API LỊCH SỬ NGHE NHẠC
app.post("/api/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { song_id, song_title, artist_name, cover_art_url, file_url } = req.body;

    await pool.query(
      "INSERT INTO history (user_id, song_id, song_title, artist_name, cover_art_url, file_url) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, song_id, song_title, artist_name, cover_art_url, file_url]
    );

    res.status(201).json({ message: "Đã lưu lịch sử" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

app.get("/api/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [history] = await pool.query(
      "SELECT * FROM history WHERE user_id = ? ORDER BY played_at DESC LIMIT 50",
      [userId]
    );
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// ===== KHỞI ĐỘNG SERVER =====
app.listen(port, () => {
  console.log(`Backend API đang chạy tại http://localhost:${port}`);
  connectToDatabase();
});
