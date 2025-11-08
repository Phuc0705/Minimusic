// history.js – PHIÊN BẢN HOÀN HẢO (v2.0)
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("minimusic_token");
  const userString = localStorage.getItem("minimusic_user");
  const navElement = document.querySelector(".navbar nav");

  // ===== KIỂM TRA ĐĂNG NHẬP =====
  if (!token || !userString) {
    alert("Vui lòng đăng nhập để xem lịch sử!");
    window.location.href = "login.html";
    return;
  }

  const user = JSON.parse(userString);
  navElement.innerHTML = `
    <a href="index.html" class="nav-button">Trang chủ</a>
    <a href="my-playlists.html" class="nav-button">Playlists</a>
    <span class="nav-username">Chào, ${user.username}</span>
    <a href="#" id="logout-button" class="nav-button">Đăng Xuất</a>
  `;

  document.getElementById("logout-button").addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "index.html";
  });

  // ===== ELEMENTS =====
  const playlistSongCountEl = document.getElementById("playlist-song-count");
  const songListContainer = document.getElementById("song-list-container");
  let currentSongs = [];

  // ===== HÀM ĐỊNH DẠNG THỜI GIAN =====
  function formatTimeAgo(dateStr) {
    if (!dateStr) return "Không rõ";
    const now = new Date();
    const played = new Date(dateStr);
    const diffMs = now - played;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return played.toLocaleDateString("vi-VN");
  }

  // ===== LẤY DỮ LIỆU =====
  async function fetchHistory() {
    try {
      const response = await fetch("http://localhost:3001/api/history", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Lỗi ${response.status}: ${text}`);
      }

      const songs = await response.json();
      currentSongs = songs;

      // Sắp xếp: mới nhất trước
      currentSongs.sort(
        (a, b) => new Date(b.played_at || 0) - new Date(a.played_at || 0)
      );

      playlistSongCountEl.innerHTML = `
        ${songs.length} bài hát
        <button id="clear-history-btn" title="Xóa toàn bộ lịch sử">
          Xóa
        </button>
      `;

      renderSongs(currentSongs);

      // Gắn sự kiện xóa lịch sử
      document
        .getElementById("clear-history-btn")
        ?.addEventListener("click", clearHistory);
    } catch (error) {
      console.error("Lỗi fetchHistory:", error);
      songListContainer.innerHTML = `<p style="color:red">Lỗi: ${error.message}</p>`;
    }
  }
  // ===== HÀM CHUYỂN TRANG PLAYER (GIỐNG HỆT favorites.js) =====
  function goToPlayerPage(index) {
    if (index < 0 || index >= currentSongs.length) return;
    const song = currentSongs[index];

    // Tạo một object song "sạch" cho player.js
    const playerSong = {
      song_id: song.song_id,
      title: song.song_title,
      artist_name: song.artist_name,
      cover_art_url: song.cover_art_url,
      file_url: song.file_url,
    };

    localStorage.setItem("currentSong", JSON.stringify(playerSong));
    // Map lại currentSongs cho đúng định dạng player.js
    const playerQueue = currentSongs.map((s) => ({
      song_id: s.song_id,
      title: s.song_title,
      artist_name: s.artist_name,
      cover_art_url: s.cover_art_url,
      file_url: s.file_url,
    }));
    localStorage.setItem("currentQueue", JSON.stringify(playerQueue));
    localStorage.setItem("currentIndex", index.toString());

    window.location.href = "player.html";
  }
  // ===== RENDER BÀI HÁT =====
  function renderSongs(songs) {
    songListContainer.innerHTML = "";
    if (songs.length === 0) {
      songListContainer.innerHTML = "<p>Bạn chưa nghe bài hát nào.</p>";
      return;
    }

    songs.forEach((song, index) => {
      const coverUrl = song.cover_art_url?.startsWith("http")
        ? song.cover_art_url
        : "assets/images/default-cover.png";

      const songRow = document.createElement("div");
      songRow.className = "song-row";
      songRow.dataset.index = index;

      songRow.innerHTML = `
        <img src="${coverUrl}" alt="${
        song.song_title
      }" class="song-row-img" onerror="this.src='assets/images/default-cover.png'">
        <div class="song-row-info">
          <h4 class="song-title">${song.song_title}</h4>
          <p class="song-artist">${song.artist_name}</p>
          <small class="song-timeago">${formatTimeAgo(song.played_at)}</small>
        </div>
        <div class="song-actions">
          <button class="play-now-btn" title="Phát ngay">Play</button>
          <button class="like-btn" data-song-id="${
            song.song_id
          }" title="Yêu thích">Heart</button>
        </div>
      `;

      songListContainer.appendChild(songRow);
    });
  }

  // ===== PHÁT NGAY KHI CLICK PLAY =====
  function playSongFromHistory(songs, index) {
    if (index < 0 || index >= songs.length) return;

    const song = songs[index];
    const playerSong = {
      song_id: song.song_id,
      title: song.song_title,
      artist_name: song.artist_name,
      cover_art_url: song.cover_art_url,
      file_url: song.file_url,
    };

    // Dùng hàm từ favorites.js (đã có sẵn)
    if (typeof playSongFromList === "function") {
      playSongFromList(playerSong, songs, index);
    } else {
      // Fallback: chuyển sang player.html
      localStorage.setItem("currentSong", JSON.stringify(playerSong));
      localStorage.setItem("currentQueue", JSON.stringify(songs));
      localStorage.setItem("currentIndex", index);
      window.location.href = "player.html";
    }
  }

  // ===== CHUYỂN SANG PLAYER.HTML =====
  function goToPlayerPage(index) {
    if (index < 0 || index >= currentSongs.length) return;
    const song = currentSongs[index];

    const playerSong = {
      song_id: song.song_id,
      title: song.song_title,
      artist_name: song.artist_name,
      cover_art_url: song.cover_art_url,
      file_url: song.file_url,
    };

    localStorage.setItem("currentSong", JSON.stringify(playerSong));
    localStorage.setItem("currentQueue", JSON.stringify(currentSongs));
    localStorage.setItem("currentIndex", index.toString());
    window.location.href = "player.html";
  }

  // ===== THÍCH / BỎ THÍCH =====
  async function toggleLike(songId, button) {
    try {
      const res = await fetch(`http://localhost:3001/api/likes/${songId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        button.classList.toggle("liked", data.liked);
        button.style.color = data.liked ? "#ff3040" : "#888";
      }
    } catch (err) {
      alert("Lỗi thích bài hát");
    }
  }

  // ===== XÓA LỊCH SỬ =====
  async function clearHistory() {
    if (!confirm("Xóa toàn bộ lịch sử nghe?")) return;

    try {
      const res = await fetch("http://localhost:3001/api/history", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        songListContainer.innerHTML = "<p>Lịch sử đã được xóa.</p>";
        playlistSongCountEl.innerHTML = "0 bài hát";
      } else {
        alert("Không thể xóa lịch sử");
      }
    } catch (err) {
      alert("Lỗi kết nối");
    }
  }

  // ===== EVENT LISTENER =====
  songListContainer.addEventListener("click", (e) => {
    const row = e.target.closest(".song-row");
    const playBtn = e.target.closest(".play-now-btn");
    const likeBtn = e.target.closest(".like-btn");

    if (playBtn && row) {
      const index = parseInt(row.dataset.index, 10);
      playSongFromHistory(currentSongs, index);
      return;
    }

    if (likeBtn) {
      const songId = likeBtn.dataset.songId;
      toggleLike(songId, likeBtn);
      return;
    }

    if (row) {
      const index = parseInt(row.dataset.index, 10);
      goToPlayerPage(index);
    }
  });

  // ===== CHẠY =====
  fetchHistory();
});
