// Chờ trang chủ tải xong
document.addEventListener("DOMContentLoaded", async () => {
  // ===== PHẦN 1: LẤY CÁC THÀNH PHẦN =====
  const token = localStorage.getItem("minimusic_token");
  const userString = localStorage.getItem("minimusic_user");
  const navElement = document.querySelector(".navbar nav");
  const myPlaylistsList = document.getElementById("my-playlists-list");
  const songsListDiv = document.getElementById("popular-songs-list");
  const searchInput = document.getElementById("search-input");

  // Biến quản lý state
  let currentSongs = [];

  // ===== PHẦN 2: KIỂM TRA ĐĂNG NHẬP =====
  if (token && userString) {
    const user = JSON.parse(userString);
    navElement.innerHTML = `
      <span class="nav-username">Chào, ${user.username}</span>
      <a href="#" id="logout-button" class="nav-button">Đăng Xuất</a>
    `;
    document.getElementById("logout-button").addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("minimusic_token");
      localStorage.removeItem("minimusic_user");
      window.location.reload();
    });
    fetchMyPlaylists(token);
  }

  // ===== PHẦN 3: HÀM LẤY PLAYLIST CỦA TÔI =====
  async function fetchMyPlaylists(token) {
    if (!myPlaylistsList) return;
    try {
      const response = await fetch("http://localhost:3001/api/my-playlists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 403) {
          myPlaylistsList.innerHTML =
            "<li>Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.</li>";
        }
        return;
      }
      const playlists = await response.json();
      myPlaylistsList.innerHTML = "";
      playlists.forEach((pl) => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="my-playlists.html">${pl.name}</a>`;
        li.setAttribute("data-playlist-id", pl.playlist_id);
        myPlaylistsList.appendChild(li);
      });
    } catch (error) {
      console.error("Lỗi fetchMyPlaylists:", error);
    }
  }

  // ===== PHẦN 4: HÀM LẤY TẤT CẢ DỮ LIỆU (ALBUM + CA SĨ + BÀI HÁT) =====
  async function fetchHomeData() {
    try {
      // 1. NEW FEED - ALBUM MỚI
      const newFeedList = document.getElementById("new-feed-list");
      if (newFeedList) {
        const albumsRes = await fetch("http://localhost:3001/api/albums/new");
        const albums = await albumsRes.json();
        newFeedList.innerHTML = albums
          .map(
            (a) => `
          <div class="horizontal-item album-card" style="cursor: pointer;" data-album-id="${a.id}">
            <img src="${a.image}" alt="${a.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
            <p style="margin: 4px 0 0; font-size: 0.9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px;">${a.name}</p>
            <small style="color: #aaa;">${a.artist_name}</small>
          </div>
        `
          )
          .join("");

        newFeedList.addEventListener("click", (e) => {
          const card = e.target.closest(".album-card");
          if (card) {
            const albumId = card.dataset.albumId;
            const albumName = card.querySelector("p").textContent;
            window.location.href = `album.html?id=${albumId}&name=${encodeURIComponent(
              albumName
            )}`;
          }
        });
      }

      // 2. CA SĨ THỊNH HÀNH
      const artistsList = document.getElementById("popular-artists-list");
      if (artistsList) {
        const artistsRes = await fetch(
          "http://localhost:3001/api/artists/popular"
        );
        const artists = await artistsRes.json();
        artistsList.innerHTML = artists
          .map(
            (a) => `
          <div class="horizontal-item artist-card" style="min-width: 100px; text-align: center; cursor: pointer;" data-artist-id="${
            a.id
          }">
            <img src="${a.image}" alt="${
              a.name
            }" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;"
                 onerror="this.src='https://via.placeholder.com/80x80/333333/FFFFFF?text=${encodeURIComponent(
                   a.name.charAt(0)
                 )}'">
            <p style="margin: 4px 0 0; font-size: 0.9em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px;">
              ${a.name}
            </p>
          </div>
        `
          )
          .join("");

        artistsList.addEventListener("click", (e) => {
          const card = e.target.closest(".artist-card");
          if (card) {
            const artistId = card.dataset.artistId;
            const artistName = card.querySelector("p").textContent;
            const cleanName = artistName.trim().replace(/[\n\r\s]+/g, " ");
            window.location.href = `artist.html?id=${artistId}&name=${encodeURIComponent(
              cleanName
            )}`;
          }
        });
      }

      // 3. BÀI HÁT MỚI NHẤT
      const songsRes = await fetch("http://localhost:3001/api/songs/popular");
      if (!songsRes.ok) throw new Error("Lỗi tải bài hát");
      const songs = await songsRes.json();

      renderSongs(songs, "horizontal-list");
      currentSongs = songs;
      document.querySelector(".song-section h3").textContent =
        "Những bài hát mới nhất";
    } catch (error) {
      console.error("Lỗi fetchHomeData:", error);
      if (songsListDiv) {
        songsListDiv.innerHTML = `<p style="color: red;">Lỗi: ${error.message}</p>`;
      }
    }
  }

  // ===== PHẦN 5: HÀM TÌM KIẾM =====
  async function handleSearch(query) {
    if (!query.trim()) {
      fetchHomeData();
      return;
    }
    try {
      songsListDiv.innerHTML = "<p>Đang tìm kiếm...</p>";
      const response = await fetch(
        `http://localhost:3001/api/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error("Lỗi tìm kiếm");
      const songs = await response.json();
      renderSongs(songs, "vertical-list");
      currentSongs = songs;
      document.querySelector(
        ".song-section h3"
      ).textContent = `Kết quả cho: "${query}"`;
    } catch (error) {
      console.error("Lỗi tìm kiếm:", error);
      songsListDiv.innerHTML = `<p style="color: red;">Lỗi: ${error.message}</p>`;
    }
  }

  // ===== PHẦN 6: RENDER BÀI HÁT =====
  function renderSongs(songs, layoutClass) {
    if (!songsListDiv) return;
    songsListDiv.innerHTML = "";
    songsListDiv.className = layoutClass;

    if (songs.length === 0) {
      songsListDiv.innerHTML = "<p>Không có kết quả.</p>";
      return;
    }

    songs.forEach((song, index) => {
      const el = document.createElement("div");
      el.dataset.index = index;
      el.className =
        layoutClass === "horizontal-list" ? "song-card" : "song-row";

      if (layoutClass === "horizontal-list") {
        el.innerHTML = `
          <img src="${song.cover_art_url}" alt="${song.title}">
          <h4>${song.title}</h4>
          <p>${song.artist_name}</p>
        `;
      } else {
        el.innerHTML = `
          <img src="${song.cover_art_url}" alt="${song.title}" class="song-row-img">
          <div class="song-row-info">
            <h4>${song.title}</h4>
            <p>${song.artist_name}</p>
          </div>
          <span class="song-row-duration">--:--</span>
        `;
      }
      songsListDiv.appendChild(el);
    });
  }

  // ===== PHẦN 7: CHUYỂN TRANG KHI CLICK BÀI HÁT =====
  function goToPlayerPage(index) {
    if (index < 0 || index >= currentSongs.length) return;
    const song = currentSongs[index];
    localStorage.setItem("currentSong", JSON.stringify(song));
    localStorage.setItem("currentQueue", JSON.stringify(currentSongs));
    localStorage.setItem("currentIndex", index);
    window.location.href = "player.html";
  }

  songsListDiv?.addEventListener("click", (e) => {
    const target = e.target.closest(".song-card, .song-row");
    if (target) {
      const index = parseInt(target.dataset.index, 10);
      if (!isNaN(index)) goToPlayerPage(index);
    }
  });

  // ===== PHẦN 8: TÌM KIẾM BẰNG ENTER HOẶC ICON =====
  searchInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(searchInput.value);
    }
  });

  document.querySelector(".search-box")?.addEventListener("click", (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX - rect.left < 60) {
      e.preventDefault();
      const q = searchInput.value.trim();
      if (q) handleSearch(q);
      else searchInput.focus();
    }
  });

  // ===== PHẦN 9: NÚT TẠO PLAYLIST =====
  document
    .getElementById("create-playlist-btn")
    ?.addEventListener("click", () => {
      if (!token) {
        alert("Vui lòng đăng nhập!");
        window.location.href = "login.html";
      } else {
        window.location.href = "my-playlists.html";
      }
    });

  // ===== PHẦN 10: KHỞI ĐỘNG =====
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get("search");

  if (searchQuery) {
    searchInput.value = searchQuery;
    handleSearch(searchQuery);
  } else {
    fetchHomeData(); // CHỈ GỌI 1 LẦN DUY NHẤT
  }
});
