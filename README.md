# 🎵 MiniMusic - Ứng dụng nghe nhạc trực tuyến

> Đồ án tích hợp 3 môn: **Web Development**, **Database**, và **Mobile Development**

## 📋 Mô tả dự án

MiniMusic là một ứng dụng nghe nhạc trực tuyến với giao diện dark theme hiện đại, tương tự Spotify. Ứng dụng cho phép người dùng:

- 🎼 Nghe nhạc trực tuyến từ Jamendo API
- 🔍 Tìm kiếm bài hát
- 📝 Tạo và quản lý playlist cá nhân
- ❤️ Yêu thích bài hát
- 📚 Xem lịch sử nghe nhạc
- 📱 Responsive design cho mobile

## 🎨 Design (Figma)

Thiết kế giao diện theo [Figma](https://www.figma.com/design/sVxk6p5Tz37HKgyMCfnEpF/Untitled?node-id=0-1&t=ZF8cdtqkTw1LHMb8-1)

### Tính năng UI:
- Dark theme với màu hồng làm điểm nhấn
- Responsive design cho desktop và mobile
- Player giống Spotify ở cuối màn hình
- Sidebar với thư viện và playlist

## 🛠️ Công nghệ sử dụng

### Frontend:
- **HTML5** - Cấu trúc trang
- **CSS3** - Styling với responsive design (media queries)
- **Vanilla JavaScript** - Logic và tương tác

### Backend:
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Axios** - HTTP client

### API:
- **Jamendo API** - Lấy nhạc miễn phí

## 📁 Cấu trúc dự án

```
project_music/
├── frontend/                 # Frontend files
│   ├── index.html           # Trang chủ
│   ├── login.html           # Trang đăng nhập
│   ├── register.html        # Trang đăng ký
│   ├── style.css            # Styling với responsive
│   ├── home.js              # Logic trang chủ
│   ├── login.js             # Logic đăng nhập
│   └── app.js               # Logic đăng ký
├── backend/                 # Backend files
│   ├── index.js             # Server API
│   └── static/              # Static files
├── database_schema.sql      # Database schema
├── package.json             # Dependencies
└── README.md                # File này
```

## 🚀 Cài đặt và chạy

### 1. Cài đặt MySQL

Tải và cài đặt MySQL từ [mysql.com](https://www.mysql.com/)

### 2. Tạo Database

```bash
# Chạy file SQL để tạo database và các bảng
mysql -u root -p < database_schema.sql
```

### 3. Cài đặt Dependencies

```bash
# Cài đặt các package cần thiết
npm install
```

### 4. Cấu hình Database

Mở file `backend/index.js` và cập nhật thông tin database:

```javascript
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "YOUR_PASSWORD",  // Thay đổi password của bạn
  database: "minimusic_db",
};
```

### 5. Chạy Backend Server

```bash
# Khởi động server ở port 3001
node backend/index.js
```

Bạn sẽ thấy: `Backend API đang chạy tại http://localhost:3001`

### 6. Mở Frontend

Mở file `frontend/index.html` bằng trình duyệt (hoặc dùng Live Server trong VS Code)

## 📱 Responsive Design

Ứng dụng được tối ưu cho 3 kích thước màn hình:

- **Desktop** (> 768px): Sidebar + Content ngang
- **Tablet** (≤ 768px): Sidebar chuyển lên trên
- **Mobile** (≤ 480px): Layout dọc, font size nhỏ hơn

## 🎯 Các tính năng chính

### 1. **Authentication** (Đăng ký/Đăng nhập)
- JWT-based authentication
- Password hashing với bcrypt
- Session management với localStorage

### 2. **Browse Music** (Duyệt nhạc)
- Hiển thị bài hát phổ biến từ Jamendo
- Tìm kiếm bài hát theo từ khóa
- UI card với cover art

### 3. **Play Music** (Phát nhạc)
- HTML5 Audio player
- Controls: Play/Pause, Volume
- Hiển thị bài hát đang phát

### 4. **Playlists** (Danh sách phát)
- Tạo playlist mới
- Xem danh sách playlist của user
- Thêm bài hát vào playlist

### 5. **Favorites** (Yêu thích)
- Thêm/xóa bài hát yêu thích
- Xem danh sách yêu thích

### 6. **History** (Lịch sử)
- Lưu lịch sử nghe nhạc
- Xem 50 bài hát gần nhất

## 🗄️ Database Schema

### Tables:
1. **users** - Thông tin người dùng
2. **playlists** - Danh sách phát
3. **playlist_tracks** - Bài hát trong playlist
4. **likes** - Bài hát yêu thích
5. **history** - Lịch sử nghe nhạc
6. **ratings** - Đánh giá bài hát (tùy chọn)

## 🔌 API Endpoints

### Public APIs:
- `POST /api/register` - Đăng ký
- `POST /api/login` - Đăng nhập
- `GET /api/songs/popular` - Lấy bài hát phổ biến
- `GET /api/search?q=keyword` - Tìm kiếm

### Protected APIs (cần JWT):
- `GET /api/my-playlists` - Lấy playlist của user
- `POST /api/playlists` - Tạo playlist
- `POST /api/playlists/:id/songs` - Thêm bài hát vào playlist
- `POST /api/likes` - Thêm yêu thích
- `DELETE /api/likes/:songId` - Xóa yêu thích
- `GET /api/likes` - Lấy danh sách yêu thích
- `POST /api/history` - Lưu lịch sử
- `GET /api/history` - Lấy lịch sử

## 🎨 UI Components

### Colors:
- Background: `#121212` (Dark)
- Cards: `#181818`
- Borders: `#282828`
- Accent: `#ff1493` (Pink)
- Text: `#ffffff` / `#b3b3b3`

### Responsive Breakpoints:
- Mobile: `≤ 480px`
- Tablet: `≤ 768px`
- Desktop: `> 768px`

## 📝 Cách sử dụng

1. **Đăng ký/Đăng nhập**: Tạo tài khoản hoặc đăng nhập
2. **Browse**: Xem bài hát phổ biến trên trang chủ
3. **Search**: Gõ từ khóa vào thanh tìm kiếm
4. **Play**: Click vào bài hát để phát
5. **Create Playlist**: Click "Tạo playlist của mình" trong sidebar
6. **Add to Playlist**: Thêm bài hát vào playlist (cần implement UI)

## 🐛 Troubleshooting

### Lỗi kết nối database:
- Kiểm tra MySQL đã chạy chưa
- Kiểm tra password trong `backend/index.js`

### Lỗi CORS:
- Đảm bảo `app.use(cors())` đã được thêm vào backend

### Lỗi Jamendo API:
- Kiểm tra internet connection
- API key có thể cần renew

## 📚 Tài liệu tham khảo

- [Jamendo API Docs](https://developer.jamendo.com/v3.0/docs)
- [Express.js Docs](https://expressjs.com/)
- [MySQL Docs](https://dev.mysql.com/doc/)

## 👥 Nhóm

- Project for Web, Database, and Mobile Development
- University Project

## 📄 License

ISC License

---

**Made with ❤️ using Node.js, Express, MySQL, and vanilla JavaScript**
