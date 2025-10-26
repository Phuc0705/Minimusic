// Chờ trang tải xong
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("minimusic_token");
  const userString = localStorage.getItem("minimusic_user");
  const playlistsGrid = document.getElementById("playlists-grid");
  const createPlaylistBtn = document.getElementById("create-playlist-submit-btn");
  const newPlaylistNameInput = document.getElementById("new-playlist-name");
  const messageEl = document.getElementById("playlist-message");
  const navElement = document.querySelector(".navbar nav");
  const searchInput = document.getElementById("search-input");

  // Check đăng nhập
  if (token && userString) {
    const user = JSON.parse(userString);
    navElement.innerHTML = `
      <a href="index.html" class="nav-button">Trang chủ</a>
      <span class="nav-username">Chào, ${user.username}</span>
      <a href="#" id="logout-button" class="nav-button">Đăng Xuất</a>
    `;
    const logoutButton = document.getElementById("logout-button");
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("minimusic_token");
      localStorage.removeItem("minimusic_user");
      window.location.href = "index.html";
    });
    
    // Load playlists
    fetchMyPlaylists(token);
  } else {
    alert("Vui lòng đăng nhập để xem playlists!");
    window.location.href = "login.html";
  }

  // ===== HÀM LẤY PLAYLIST CỦA TÔI =====
  async function fetchMyPlaylists(token) {
    if (!playlistsGrid) return;
    try {
      const response = await fetch("http://localhost:3001/api/my-playlists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Không thể tải playlist");
      }
      const playlists = await response.json();
      renderPlaylists(playlists);
    } catch (error) {
      console.error("Lỗi fetchMyPlaylists:", error);
      playlistsGrid.innerHTML = "<p>Lỗi tải playlist</p>";
    }
  }

  // ===== HÀM HIỂN THỊ PLAYLISTS =====
  function renderPlaylists(playlists) {
    if (!playlistsGrid) return;
    playlistsGrid.innerHTML = "";
    
    if (playlists.length === 0) {
      playlistsGrid.innerHTML = `
        <div class="empty-playlist">
          <p>Bạn chưa có playlist nào. Hãy tạo playlist đầu tiên!</p>
        </div>
      `;
      return;
    }

    playlists.forEach((playlist) => {
      const playlistCard = document.createElement("div");
      playlistCard.className = "playlist-card";
      playlistCard.setAttribute("data-playlist-id", playlist.playlist_id);
      
      playlistCard.innerHTML = `
        <div class="playlist-placeholder">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        </div>
        <h4>${playlist.name}</h4>
        <p>${playlist.playlist_id} bài hát</p>
      `;
      
      playlistCard.addEventListener("click", () => {
        // TODO: Mở trang chi tiết playlist
        console.log("Click vào playlist:", playlist.name);
      });
      
      playlistsGrid.appendChild(playlistCard);
    });
  }

  // ===== TẠO PLAYLIST MỚI =====
  if (createPlaylistBtn) {
    createPlaylistBtn.addEventListener("click", async () => {
      const playlistName = newPlaylistNameInput.value.trim();
      if (!playlistName) {
        showMessage("Vui lòng nhập tên playlist!", "error");
        return;
      }

      try {
        const response = await fetch("http://localhost:3001/api/playlists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: playlistName }),
        });

        const data = await response.json();
        
        if (response.ok) {
          showMessage(`Tạo playlist "${playlistName}" thành công!`, "success");
          newPlaylistNameInput.value = "";
          fetchMyPlaylists(token);
        } else {
          showMessage(data.message, "error");
        }
      } catch (error) {
        console.error("Lỗi tạo playlist:", error);
        showMessage("Lỗi khi tạo playlist", "error");
      }
    });
  }

  // ===== HÀM HIỂN THỊ MESSAGE =====
  function showMessage(message, type) {
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.style.color = type === "success" ? "green" : "red";
    
    setTimeout(() => {
      messageEl.textContent = "";
    }, 3000);
  }

  // ===== EVENT LISTENER CHO TÌM KIẾM =====
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = searchInput.value;
        if (query) {
          window.location.href = `index.html?search=${encodeURIComponent(query)}`;
        }
      }
    });

    // Click icon để search
    const searchBox = document.querySelector(".search-box");
    if (searchBox) {
      searchBox.addEventListener("click", (e) => {
        const rect = searchBox.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        
        if (clickX < 60) {
          e.preventDefault();
          e.stopPropagation();
          const query = searchInput.value.trim();
          
          if (query) {
            window.location.href = `index.html?search=${encodeURIComponent(query)}`;
          } else {
            searchInput.focus();
          }
          return false;
        }
      });
    }
  }
});

