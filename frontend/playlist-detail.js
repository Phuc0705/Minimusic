// Dán code này vào đầu file playlist-detail.js

// ===== KIỂM TRA ĐĂNG NHẬP CHO HEADER =====
const token = localStorage.getItem("minimusic_token");
const userString = localStorage.getItem("minimusic_user");
const navElement = document.querySelector(".navbar nav");

if (token && userString) {
  const user = JSON.parse(userString);
  navElement.innerHTML = `
        <a href="index.html" class="nav-button">Trang chủ</a>
        <a href="my-playlists.html" class="nav-button">Playlists</a>
        <span class="nav-username">Chào, ${user.username}</span>
        <a href="#" id="logout-button" class="nav-button">Đăng Xuất</a>
    `;
  const logoutButton = document.getElementById("logout-button");
  logoutButton.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("minimusic_token");
    localStorage.removeItem("minimusic_user");
    window.location.href = "index.html"; // Quay về trang chủ
  });
}
// ======================================

// (Code cũ của cậu để fetch playlist bắt đầu từ đây...)
const playlistNameEl = document.getElementById("playlist-name");
// ...// Trong file playlist-detail.js

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("minimusic_token");
  const userString = localStorage.getItem("minimusic_user");

  // Lấy các element
  const playlistNameEl = document.getElementById("playlist-name");
  const playlistOwnerEl = document.getElementById("playlist-owner");
  const playlistSongCountEl = document.getElementById("playlist-song-count");
  const songListContainer = document.getElementById("song-list-container");

  let currentSongs = []; // Để lưu danh sách bài hát cho player

  // Lấy playlist ID từ URL (ví dụ: ?id=123)
  const urlParams = new URLSearchParams(window.location.search);
  const playlistId = urlParams.get("id");

  if (!playlistId) {
    alert("Không tìm thấy ID playlist!");
    window.location.href = "my-playlists.html";
    return;
  }

  // Check đăng nhập (để gọi API bảo mật)
  if (!token) {
    alert("Vui lòng đăng nhập!");
    window.location.href = "login.html";
    return;
  }

  // Điền tên user vào header
  if (userString) {
    const user = JSON.parse(userString);
    // (Thêm code để cập nhật navbar, hiển thị "Chào, [username]"...)
  }

  // ===== HÀM LẤY CHI TIẾT PLAYLIST =====
  async function fetchPlaylistDetails() {
    try {
      const response = await fetch(
        `http://localhost:3001/api/playlists/${playlistId}/songs`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Lỗi tải playlist");
      }

      const songs = await response.json();
      currentSongs = songs; // Lưu lại

      // Cập nhật thông tin header
      // (Backend API của cậu chưa trả về tên, mình sẽ lấy tạm)
      // Tốt hơn là Backend /api/playlists/:playlistId/songs nên trả về { name: "Tên Playlist", songs: [...] }
      playlistNameEl.textContent = `Playlist (ID: ${playlistId})`;
      playlistSongCountEl.textContent = `${songs.length} bài hát`;

      // Render danh sách bài hát
      renderSongs(songs);
    } catch (error) {
      console.error("Lỗi fetchPlaylistDetails:", error);
      songListContainer.innerHTML = `<p style="color: red;">Lỗi: ${error.message}</p>`;
    }
  }

  // ===== HÀM RENDER BÀI HÁT (Giống home.js) =====
  function renderSongs(songs) {
    songListContainer.innerHTML = "";
    if (songs.length === 0) {
      songListContainer.innerHTML = "<p>Playlist này chưa có bài hát nào.</p>";
      return;
    }

    songs.forEach((song, index) => {
      const songRow = document.createElement("div");
      songRow.className = "song-row";
      songRow.setAttribute("data-index", index); // Lưu index

      songRow.innerHTML = `
        <img src="${song.cover_art_url}" alt="${song.song_title}" class="song-row-img">
        <div class="song-row-info">
          <h4>${song.song_title}</h4>
          <p>${song.artist_name}</p>
        </div>
        <span class="song-row-duration">--:--</span>
      `;
      songListContainer.appendChild(songRow);
    });
  }

  // ===== HÀM CHUYỂN TRANG PLAYER (Giống home.js) =====
  function goToPlayerPage(index) {
    if (index < 0 || index >= currentSongs.length) return;
    const song = currentSongs[index];

    localStorage.setItem("currentSong", JSON.stringify(song));
    localStorage.setItem("currentQueue", JSON.stringify(currentSongs));
    localStorage.setItem("currentIndex", index.toString());
    window.location.href = "player.html";
  }

  // ===== EVENT LISTENER CLICK BÀI HÁT =====
  songListContainer.addEventListener("click", (e) => {
    const row = e.target.closest(".song-row");
    if (row) {
      const index = parseInt(row.dataset.index, 10);
      if (!isNaN(index)) {
        goToPlayerPage(index);
      }
    }
  });

  // ===== CHẠY HÀM KHI TẢI TRANG =====
  fetchPlaylistDetails();
});
