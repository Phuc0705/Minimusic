// Chờ trang tải xong
document.addEventListener("DOMContentLoaded", () => {
  // ===== LẤY CÁC ELEMENTS =====
  const token = localStorage.getItem("minimusic_token");
  const userString = localStorage.getItem("minimusic_user");

  const currentAlbumArt = document.getElementById("current-album-art");
  const currentArtist = document.getElementById("current-artist");
  const currentTitle = document.getElementById("current-title");
  const playSongBtn = document.getElementById("play-song-btn");
  const addToPlaylistBtn = document.getElementById("add-to-playlist-btn");
  const mainProgressBar = document.getElementById("main-progress-bar");
  const currentTimeDisplay = document.getElementById("current-time-display");
  const durationDisplay = document.getElementById("duration-display");
  const player = document.getElementById("background-player");

  const albumsLikeGrid = document.getElementById("albums-like-grid");
  const albumsMightGrid = document.getElementById("albums-might-grid");
  const nextQueue = document.getElementById("next-queue");

  const artistImage = document.getElementById("artist-image");
  const artistName = document.getElementById("artist-name");
  const artistAge = document.getElementById("artist-age");
  const artistListeners = document.getElementById("artist-listeners");
  const artistBio = document.getElementById("artist-bio");
  const followBtn = document.getElementById("follow-btn");

  const likeBtn = document.getElementById("like-btn"); // Lấy nút Like ở đây

  // Waveform canvas
  const waveformCanvas = document.getElementById("waveform-canvas");

  let currentSong = null;
  let currentQueue = [];
  let currentIndex = -1; // Thêm dòng này
  let isPlaying = false;
  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let animationFrameId = null;

  // Player states
  let isShuffled = false;
  let repeatMode = "off"; // 'off', 'one', 'all'

  // ===== CHECK ĐĂNG NHẬP =====
  if (token && userString) {
    const user = JSON.parse(userString);
    const navUsername = document.getElementById("nav-username");
    const logoutButton = document.getElementById("logout-button");

    if (navUsername) navUsername.textContent = user.username;
    if (navUsername) navUsername.style.display = "inline-block";
    if (logoutButton) logoutButton.style.display = "inline-block";

    if (logoutButton) {
      logoutButton.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("minimusic_token");
        localStorage.removeItem("minimusic_user");
        window.location.href = "index.html";
      });
    }
  }

  // ===== LOAD THÔNG TIN BÀI HÁT TỪ LOCAL STORAGE =====
  function loadCurrentSong() {
    const songData = localStorage.getItem("currentSong");
    const queueData = localStorage.getItem("currentQueue");
    const indexData = localStorage.getItem("currentIndex");

    if (songData) {
      currentSong = JSON.parse(songData);
      updateUI(currentSong); // updateUI sẽ gọi loadLikeStatus
      // playSong(); // Tắt tự động phát
    } else {
      alert("Không có bài hát nào để phát!");
      window.location.href = "index.html";
      return;
    }

    if (queueData) {
      currentQueue = JSON.parse(queueData);
      if (indexData !== null) {
        currentIndex = parseInt(indexData, 10);
      }
      renderQueue();
    } else {
      loadPopularForQueue();
    }

    loadSimilarAlbums();
    loadMightLikeAlbums();
  }

  // ===== CẬP NHẬT UI =====
  function updateUI(song) {
    if (!song) return;
    currentAlbumArt.src = song.cover_art_url;
    currentArtist.textContent = song.artist_name;
    currentTitle.textContent = song.title;
    player.src = song.file_url;

    // TẢI LẠI TRẠNG THÁI LIKE KHI ĐỔI BÀI
    loadLikeStatus(song.song_id);
  }

  // ===== PHÁT NHẠC =====
  function playSong() {
    if (!currentSong) return;
    player
      .play()
      .then(() => {
        isPlaying = true;
        playSongBtn.textContent = "⏸ TẠM DỪNG";
        playSongBtn.classList.add("playing");
        setupAudioContext();
        animateWaveform();
        loadArtistInfo(currentSong.artist_name);
        saveToHistory(currentSong); // Lưu lịch sử khi phát
      })
      .catch((err) => {
        console.error("Lỗi phát nhạc:", err); // Lỗi NotAllowedError sẽ hiện ở đây
      });
  }

  // ===== SETUP AUDIO CONTEXT =====
  function setupAudioContext() {
    try {
      if (!audioContext) {
        console.log("Sử dụng fake waveform do CORS");
        audioContext = null;
        analyser = null;
        dataArray = null;
      }
    } catch (err) {
      console.error("Lỗi setup audio context:", err);
      audioContext = null;
    }
  }

  // ===== CÁC HÀM WAVEFORM (Giữ nguyên) =====
  let waveformBars = [];
  let waveformFrame = 0;
  function animateWaveform() {
    if (!waveformCanvas || !isPlaying) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      return;
    }
    const canvas = waveformCanvas;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawAnimatedWaveform(ctx, canvas);
    animationFrameId = requestAnimationFrame(animateWaveform);
  }
  function drawAnimatedWaveform(ctx, canvas) {
    const numBars = 80;
    const barWidth = canvas.width / numBars;
    const centerY = canvas.height / 2;
    const maxBarHeight = canvas.height * 0.4;
    waveformFrame++;
    if (waveformBars.length === 0) {
      for (let i = 0; i < numBars; i++) {
        waveformBars.push({
          baseHeight: Math.random() * 15 + 8,
          phase: Math.random() * Math.PI * 2,
          speed: 0.1 + Math.random() * 0.1,
        });
      }
    }
    for (let i = 0; i < numBars; i++) {
      const bar = waveformBars[i];
      const wave = Math.sin(waveformFrame * bar.speed + bar.phase) * 0.5 + 0.5;
      const animatedHeight = Math.min(
        bar.baseHeight + wave * 8 + Math.random() * 3,
        maxBarHeight
      );
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#00ff88");
      gradient.addColorStop(0.5, "#00d4ff");
      gradient.addColorStop(1, "#0088ff");
      ctx.shadowBlur = 5;
      ctx.shadowColor = "#00ff88";
      ctx.fillStyle = gradient;
      const x = i * barWidth + 1;
      const y1 = centerY - animatedHeight;
      const y2 = centerY;
      const barHeight = animatedHeight;
      ctx.fillRect(x, y1, barWidth - 2, barHeight);
      ctx.fillRect(x, y2, barWidth - 2, barHeight);
      ctx.shadowBlur = 0;
    }
  }

  // ===== CÁC HÀM LOAD DỮ LIỆU PHỤ (Giữ nguyên) =====
  async function loadPopularForQueue() {
    try {
      const response = await fetch("http://localhost:3001/api/songs/popular");
      if (!response.ok) throw new Error("Failed to load");
      const songs = await response.json();
      currentQueue = songs.slice(0, 10);
      renderQueue();
    } catch (error) {
      console.error("Lỗi load queue:", error);
    }
  }
  function renderQueue() {
    if (!nextQueue || !currentSong) return;
    nextQueue.innerHTML = "";
    const currentIndexInQueue = currentQueue.findIndex(
      (s) => s.song_id.toString() === currentSong.song_id.toString()
    );
    const nextSongs = currentQueue.slice(
      currentIndexInQueue + 1,
      currentIndexInQueue + 6
    );
    nextSongs.forEach((song, index) => {
      const queueItem = document.createElement("div");
      queueItem.className = "queue-item";
      queueItem.innerHTML = `<img src="${song.cover_art_url}" alt="${song.title}"><span>${song.title}</span>`;
      queueItem.addEventListener("click", () => {
        currentIndex = currentIndexInQueue + 1 + index; // Cập nhật currentIndex
        currentSong = song;
        updateUI(song);
        playSong();
        renderQueue();
      });
      nextQueue.appendChild(queueItem);
    });
  }
  async function loadSimilarAlbums() {
    try {
      const response = await fetch("http://localhost:3001/api/songs/popular");
      if (!response.ok) throw new Error("Failed to load");
      const songs = await response.json();
      renderAlbums(songs.slice(0, 6), albumsLikeGrid);
    } catch (error) {
      console.error("Lỗi load similar albums:", error);
    }
  }
  async function loadMightLikeAlbums() {
    try {
      const response = await fetch("http://localhost:3001/api/songs/popular");
      if (!response.ok) throw new Error("Failed to load");
      const songs = await response.json();
      renderAlbums(songs.slice(6, 12), albumsMightGrid); // Lấy 6 bài khác
    } catch (error) {
      console.error("Lỗi load might like albums:", error);
    }
  }
  function renderAlbums(songs, gridElement) {
    if (!gridElement) return;
    gridElement.innerHTML = "";
    songs.forEach((song, index) => {
      const albumCard = document.createElement("div");
      albumCard.className = "album-card";
      albumCard.innerHTML = `
        <img src="${song.cover_art_url}" alt="${song.title}">
        <h4>${song.title}</h4>
        <p>${song.artist_name}</p>
      `;
      albumCard.addEventListener("click", () => {
        // Tìm index của bài hát này trong currentQueue (hoặc load lại queue)
        // Đây là cách đơn giản:
        currentSong = song;
        currentIndex = currentQueue.findIndex(
          (s) => s.song_id.toString() === song.song_id.toString()
        );
        if (currentIndex === -1) {
          // Nếu bài hát ko có trong queue, thêm vào
          currentQueue.unshift(song);
          currentIndex = 0;
        }
        updateUI(song);
        playSong();
        renderQueue(); // Cập nhật lại queue
      });
      gridElement.appendChild(albumCard);
    });
  }
  function loadArtistInfo(artistName) {
    artistImage.src = currentAlbumArt.src;
    artistName.textContent = artistName;
    artistAge.textContent = "Age: Unknown";
    artistListeners.textContent = "Unknown monthly listeners";
    artistBio.textContent = `About ${artistName}: Information about this artist will be loaded from database.`;
  }

  // ===== EVENT LISTENERS (Giữ nguyên) =====
  if (playSongBtn) {
    playSongBtn.addEventListener("click", () => {
      if (isPlaying) {
        player.pause();
        playSongBtn.textContent = "▶ PHÁT";
        playSongBtn.classList.remove("playing");
        isPlaying = false;
      } else {
        playSong();
      }
    });
  }

  // NÚT "+ THÊM VÀO PLAYLIST" (ĐÃ SỬA)
  if (addToPlaylistBtn) {
    addToPlaylistBtn.addEventListener("click", async () => {
      if (!token || !currentSong) {
        alert("Vui lòng đăng nhập để sử dụng tính năng này!");
        window.location.href = "login.html";
        return;
      }
      try {
        const response = await fetch("http://localhost:3001/api/my-playlists", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Không thể tải danh sách playlist.");
        const playlists = await response.json();
        if (playlists.length === 0) {
          alert("Bạn chưa có playlist nào. Hãy tạo một playlist trước!");
          window.location.href = "my-playlists.html";
          return;
        }
        let promptMessage = "Chọn playlist để thêm bài hát:\n\n";
        playlists.forEach((pl, index) => {
          promptMessage += `${index + 1}: ${pl.name}\n`;
        });
        const choice = prompt(promptMessage);
        if (choice === null) return;
        const playlistIndex = parseInt(choice, 10) - 1;
        if (
          isNaN(playlistIndex) ||
          playlistIndex < 0 ||
          playlistIndex >= playlists.length
        ) {
          alert("Lựa chọn không hợp lệ!");
          return;
        }
        const selectedPlaylist = playlists[playlistIndex];
        const addSongResponse = await fetch(
          `http://localhost:3001/api/playlists/${selectedPlaylist.playlist_id}/songs`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              song_id: currentSong.song_id.toString(),
              song_title: currentSong.title,
              artist_name: currentSong.artist_name,
              cover_art_url: currentSong.cover_art_url,
              file_url: currentSong.file_url,
            }),
          }
        );
        const addSongData = await addSongResponse.json();
        if (addSongResponse.ok) {
          alert(
            `Đã thêm "${currentSong.title}" vào playlist "${selectedPlaylist.name}"!`
          );
        } else {
          alert(`Lỗi: ${addSongData.message}`);
        }
      } catch (error) {
        console.error("Lỗi khi thêm vào playlist:", error);
        alert("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    });
  }

  // ===== CÁC NÚT ĐIỀU KHIỂN (Giữ nguyên) =====
  const shuffleBtn = document.getElementById("shuffle-btn");
  const prevSongBtn = document.getElementById("prev-song-btn");
  const rewind10sBtn = document.getElementById("rewind-10s-btn");
  const forward10sBtn = document.getElementById("forward-10s-btn");
  const nextSongBtn = document.getElementById("next-song-btn");
  const repeatBtn = document.getElementById("repeat-btn");

  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      isShuffled = !isShuffled;
      shuffleBtn.classList.toggle("active", isShuffled);
      if (isShuffled) {
        const shuffledQueue = [...currentQueue];
        // Don't shuffle current song
        const current = shuffledQueue.splice(currentIndex, 1)[0];
        for (let i = shuffledQueue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledQueue[i], shuffledQueue[j]] = [
            shuffledQueue[j],
            shuffledQueue[i],
          ];
        }
        currentQueue = [current, ...shuffledQueue];
        currentIndex = 0; // Reset index
        renderQueue();
      }
    });
  }
  if (prevSongBtn) {
    prevSongBtn.addEventListener("click", () => {
      if (currentIndex > 0) {
        currentIndex--;
        currentSong = currentQueue[currentIndex];
        updateUI(currentSong);
        playSong();
        renderQueue();
      }
    });
  }
  if (rewind10sBtn) {
    rewind10sBtn.addEventListener("click", () => {
      player.currentTime = Math.max(0, player.currentTime - 10);
    });
  }
  if (forward10sBtn) {
    forward10sBtn.addEventListener("click", () => {
      player.currentTime = Math.min(player.duration, player.currentTime + 10);
    });
  }
  if (nextSongBtn) {
    nextSongBtn.addEventListener("click", () => {
      if (currentIndex < currentQueue.length - 1) {
        currentIndex++;
        currentSong = currentQueue[currentIndex];
        updateUI(currentSong);
        playSong();
        renderQueue();
      } else if (repeatMode === "all" && currentQueue.length > 0) {
        currentIndex = 0;
        currentSong = currentQueue[0];
        updateUI(currentSong);
        playSong();
        renderQueue();
      }
    });
  }
  if (repeatBtn) {
    repeatBtn.addEventListener("click", () => {
      if (repeatMode === "off") {
        repeatMode = "one";
        repeatBtn.classList.add("active");
        repeatBtn.textContent = "🔂";
      } else if (repeatMode === "one") {
        repeatMode = "all";
        repeatBtn.textContent = "🔁";
      } else {
        repeatMode = "off";
        repeatBtn.classList.remove("active");
        repeatBtn.textContent = "🔁";
      }
    });
  }
  if (mainProgressBar) {
    mainProgressBar.addEventListener("input", (e) => {
      const value = e.target.value;
      if (player.duration) {
        player.currentTime = (value / 100) * player.duration;
      }
    });
  }
  if (player) {
    player.addEventListener("timeupdate", () => {
      if (player.duration) {
        const percent = (player.currentTime / player.duration) * 100;
        mainProgressBar.value = percent;
        currentTimeDisplay.textContent = formatTime(player.currentTime);
        durationDisplay.textContent = formatTime(player.duration);
      }
    });
    player.addEventListener("ended", () => {
      if (repeatMode === "one") {
        player.currentTime = 0;
        player.play();
        return;
      }
      // Auto play next song
      if (currentIndex < currentQueue.length - 1) {
        currentIndex++;
        currentSong = currentQueue[currentIndex];
        updateUI(currentSong);
        playSong();
        renderQueue();
      } else if (repeatMode === "all" && currentQueue.length > 0) {
        currentIndex = 0;
        currentSong = currentQueue[0];
        updateUI(currentSong);
        playSong();
        renderQueue();
      } else {
        // Hết queue, dừng phát
        playSongBtn.textContent = "▶ PHÁT";
        playSongBtn.classList.remove("playing");
        isPlaying = false;
      }
    });
  }

  // ===== HÀM LƯU LỊCH SỬ (Giữ nguyên) =====
  async function saveToHistory(song) {
    const token = localStorage.getItem("minimusic_token");
    if (!token || !song) {
      // Thêm kiểm tra !song
      console.error("No token or no song, cannot save history");
      return;
    }
    try {
      const response = await fetch("http://localhost:3001/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          song_id: song.song_id.toString(), // Đảm bảo là string
          song_title: song.title,
          artist_name: song.artist_name,
          cover_art_url: song.cover_art_url,
          file_url: song.file_url,
        }),
      });
      if (response.ok) {
        console.log("History saved!");
      } else {
        const errData = await response.json();
        console.error("Failed to save history:", errData.message);
      }
    } catch (error) {
      console.error("Error saving history:", error);
    }
  }

  // ===== HELPER FUNCTIONS (Giữ nguyên) =====
  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // ===== LOAD DATA =====
  loadCurrentSong();

  // ===== PHẦN CODE LIKE (ĐẶT Ở NGOÀI CÙNG) =====

  // Hàm load trạng thái like từ DB
  async function loadLikeStatus(songId) {
    const token = localStorage.getItem("minimusic_token");
    if (!token || !songId || !likeBtn) return; // Thêm kiểm tra !likeBtn

    try {
      const response = await fetch("http://localhost:3001/api/likes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;

      const likes = await response.json();
      const isLiked = likes.some((l) => l.song_id === songId.toString()); // Đảm bảo so sánh string
      likeBtn.classList.toggle("liked", isLiked);
    } catch (error) {
      console.error("Lỗi load like status:", error);
    }
  }

  // Khi click like → POST/DELETE vào DB
  if (likeBtn) {
    likeBtn.addEventListener("click", async () => {
      const token = localStorage.getItem("minimusic_token");
      if (!token || !currentSong) {
        // Thêm kiểm tra !currentSong
        alert("Vui lòng đăng nhập!");
        return;
      }

      const isLiked = likeBtn.classList.contains("liked");
      const method = isLiked ? "DELETE" : "POST";
      const songId = currentSong.song_id.toString(); // Đảm bảo là string

      // SỬA LẠI URL (ĐÃ SỬA LỖI GÕ NHẦM)
      const apiUrl = isLiked
        ? `http://localhost:3001/api/likes/${songId}`
        : "http://localhost:3001/api/likes";

      try {
        const response = await fetch(apiUrl, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body:
            method === "POST"
              ? JSON.stringify({
                  song_id: songId,
                  song_title: currentSong.title,
                  artist_name: currentSong.artist_name,
                  cover_art_url: currentSong.cover_art_url,
                  file_url: currentSong.file_url,
                })
              : null,
        });

        if (response.ok) {
          likeBtn.classList.toggle("liked");
          console.log(isLiked ? "Đã bỏ thích" : "Đã thích bài hát");
        } else {
          const data = await response.json();
          console.error("Lỗi like:", data.message);
          alert(`Lỗi: ${data.message}`); // Thêm alert
        }
      } catch (error) {
        console.error("Lỗi mạng:", error);
        alert("Lỗi mạng khi like. Vui lòng thử lại."); // Thêm alert
      }
    });
  }

  // ===== SEARCH FUNCTIONALITY (Giữ nguyên) =====
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `index.html?search=${encodeURIComponent(
            query
          )}`;
        }
      }
    });

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
            window.location.href = `index.html?search=${encodeURIComponent(
              query
            )}`;
          } else {
            searchInput.focus();
          }
          return false;
        }
      });
    }
  }
}); // Đóng DOMContentLoaded
