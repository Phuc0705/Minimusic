// Chờ trang chủ tải xong
document.addEventListener("DOMContentLoaded", () => {
  // ===== PHẦN 1: LẤY CÁC THÀNH PHẦN =====
  const token = localStorage.getItem("minimusic_token");
  const userString = localStorage.getItem("minimusic_user");
  const navElement = document.querySelector(".navbar nav");
  const myPlaylistsList = document.getElementById("my-playlists-list");
  const songsListDiv = document.getElementById("popular-songs-list");
  const player = document.getElementById("music-player");
  const songTitleEl = document.getElementById("current-song-title");
  const searchInput = document.getElementById("search-input");

  // Player controls
  const playPauseBtn = document.getElementById("play-pause-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const rewindBtn = document.getElementById("rewind-btn");
  const forwardBtn = document.getElementById("forward-btn");
  const progressBar = document.getElementById("progress-bar");
  const currentTimeEl = document.getElementById("current-time");
  const durationEl = document.getElementById("duration");

  // Fullscreen player elements
  const fullscreenPlayer = document.getElementById("fullscreen-player");
  const musicPlayerBar = document.getElementById("music-player-bar");
  const backBtn = document.getElementById("back-btn");
  const fullscreenTitle = document.getElementById("fullscreen-title");
  const fullscreenArtist = document.getElementById("fullscreen-artist");
  const fullscreenAlbumArt = document.getElementById("fullscreen-album-art");
  const waveformCanvas = document.getElementById("waveform");
  const fullscreenPlayPauseBtn = document.getElementById("fullscreen-play-pause-btn");
  const fullscreenPrevBtn = document.getElementById("fullscreen-prev-btn");
  const fullscreenNextBtn = document.getElementById("fullscreen-next-btn");
  const fullscreenRewindBtn = document.getElementById("fullscreen-rewind-btn");
  const fullscreenForwardBtn = document.getElementById("fullscreen-forward-btn");
  const fullscreenProgressBar = document.getElementById("fullscreen-progress-bar");
  const fullscreenCurrentTime = document.getElementById("fullscreen-current-time");
  const fullscreenDuration = document.getElementById("fullscreen-duration");

  // Biến quản lý state
  let currentSongs = []; // Danh sách bài hát hiện tại
  let currentIndex = -1; // Index bài hát đang phát
  let isPlaying = false;
  let audioContext = null;
  let analyser = null;
  let dataArray = null;

  // ===== PHẦN 2: KIỂM TRA ĐĂNG NHẬP =====
  if (token && userString) {
    const user = JSON.parse(userString);
    navElement.innerHTML = `
      <span class="nav-username">Chào, ${user.username}</span>
      <a href="#" id="logout-button" class="nav-button">Đăng Xuất</a>
    `;
    const logoutButton = document.getElementById("logout-button");
    logoutButton.addEventListener("click", (e) => {
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
            "<li>Phiên đăng nhập hết hạn. Vui lòng Đăng xuất và Đăng nhập lại.</li>";
        }
        throw new Error("Không thể tải playlist");
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
      if (!myPlaylistsList.innerHTML) {
        myPlaylistsList.innerHTML = "<li>Lỗi tải playlist</li>";
      }
    }
  }

  // ===== PHẦN 4: HÀM LẤY DANH SÁCH BÀI HÁT (JAMENDO - 1 BƯỚC) =====
  async function fetchPopularSongs() {
    try {
      const response = await fetch("http://localhost:3001/api/songs/popular");
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Lỗi server");
      }
      const songs = await response.json();

      songsListDiv.innerHTML = "";
      songs.forEach((song, index) => {
        const songCard = document.createElement("div");
        songCard.className = "song-card";
        songCard.setAttribute("data-song-id", song.song_id);
        songCard.setAttribute("data-song-title", song.title);
        songCard.setAttribute("data-artist-name", song.artist_name);
        songCard.setAttribute("data-file-url", song.file_url);

        songCard.innerHTML = `
          <img src="${song.cover_art_url}" alt="${song.title}">
          <h4>${song.title}</h4>
          <p>${song.artist_name}</p>
        `;
        songsListDiv.appendChild(songCard);
      });

      // Lưu danh sách bài hát vào currentSongs
      currentSongs = songs;
    } catch (error) {
      console.error("Lỗi fetchPopularSongs:", error);
      songsListDiv.innerHTML = `<p style="color: red;">Lỗi: ${error.message}</p>`;
    }
  }

  // ===== PHẦN 5: HÀM HELPERS =====
  function getSongDuration(index) {
    // Tạm thời trả về duration mặc định
    return "2:30";
  }

  // ===== PHẦN 6: HÀM TÌM KIẾM =====
    async function handleSearch(query) {
      if (!query.trim()) {
      songsListDiv.className = "horizontal-list";
        fetchPopularSongs();
      document.querySelector(".song-section h3").textContent = "Những bài hát đang phổ biến";
        return;
      }

      try {
        songsListDiv.innerHTML = "<p>Đang tìm kiếm...</p>";

        const response = await fetch(
          `http://localhost:3001/api/search?q=${encodeURIComponent(query)}`
        );
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Lỗi tìm kiếm");
        }

        const songs = await response.json();
        songsListDiv.innerHTML = "";

        if (songs.length === 0) {
        songsListDiv.innerHTML = "<p>Không tìm thấy kết quả nào cho từ khóa này.</p>";
          return;
        }

      // Thay đổi layout sang vertical list cho search results
      songsListDiv.className = "vertical-list";
      
      songs.forEach((song, index) => {
        const songRow = document.createElement("div");
        songRow.className = "song-row";
        songRow.setAttribute("data-song-id", song.song_id);
        songRow.setAttribute("data-song-title", song.title);
        songRow.setAttribute("data-artist-name", song.artist_name);
        songRow.setAttribute("data-file-url", song.file_url);

        songRow.innerHTML = `
          <img src="${song.cover_art_url}" alt="${song.title}" class="song-row-img">
          <div class="song-row-info">
                <h4>${song.title}</h4>
                <p>${song.artist_name}</p>
          </div>
          <span class="song-row-duration">${getSongDuration(index)}</span>
            `;
        songsListDiv.appendChild(songRow);
        });

      document.querySelector(".song-section h3").textContent = `Kết quả tìm kiếm cho: "${query}"`;
      
      // Cập nhật currentSongs
      currentSongs = songs;
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
        songsListDiv.innerHTML = `<p style="color: red;">Lỗi tìm kiếm: ${error.message}</p>`;
      }
  }

  // ===== PHẦN 7: HÀM PHÁT NHẠC =====
  function playSong(index) {
    if (index < 0 || index >= currentSongs.length) return;
    
    currentIndex = index;
    const song = currentSongs[index];
    
    console.log("Đang chuyển sang trang player:", song.title);
    
    // Lưu thông tin bài hát vào localStorage
    localStorage.setItem("currentSong", JSON.stringify(song));
    
    // Lưu queue (danh sách bài hát) vào localStorage
    localStorage.setItem("currentQueue", JSON.stringify(currentSongs));
    
    // Chuyển sang trang player
    window.location.href = "player.html";
  }
  
  // Setup audio context cho waveform visualization (TẠM THỜI KHÔNG DÙNG ĐỂ TRÁNH CORS)
  function setupAudioContext() {
    // KHÔNG setup audio context vì gặp lỗi CORS với Jamendo
    // Thay vào đó, dùng waveform giả
    console.log("Bỏ qua audio context do CORS. Sử dụng waveform giả thay thế.");
    audioContext = null;
    analyser = null;
    dataArray = null;
  }
  
  // Animate waveform
  let animationFrameId = null;
  function animateWaveform() {
    if (!fullscreenPlayer || !isPlaying) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      return;
    }
    
    // Nếu không có audio context, vẽ waveform giả
    if (!analyser || !dataArray) {
      drawFakeWaveform();
    } else {
      analyser.getByteFrequencyData(dataArray);
      
      const canvas = waveformCanvas;
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = canvas.width / dataArray.length * 2;
      let x = 0;
      
      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#ff1493');
        gradient.addColorStop(0.5, '#ff69b4');
        gradient.addColorStop(1, '#ffffff');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        
        x += barWidth;
      }
    }
    
    animationFrameId = requestAnimationFrame(animateWaveform);
  }
  
  // Vẽ waveform giả khi không có audio context
  let fakeWaveformData = [];
  let fakeWaveformFrame = 0;
  
  function initFakeWaveformData() {
    const canvas = waveformCanvas;
    const barWidth = 4;
    const numBars = Math.floor(canvas.offsetWidth / barWidth);
    fakeWaveformData = [];
    
    // Khởi tạo dữ liệu với một số vùng có amplitude cao hơn
    for (let i = 0; i < numBars; i++) {
      fakeWaveformData.push({
        baseAmplitude: 0.3 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        frequency: 0.005 + Math.random() * 0.01
      });
    }
  }
  
  function drawFakeWaveform() {
    const canvas = waveformCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Khởi tạo lại nếu cần
    if (fakeWaveformData.length === 0 || fakeWaveformData.length !== Math.floor(canvas.width / 4)) {
      initFakeWaveformData();
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = 4;
    fakeWaveformFrame++;
    
    for (let i = 0; i < fakeWaveformData.length; i++) {
      const bar = fakeWaveformData[i];
      const wave = Math.sin(fakeWaveformFrame * bar.frequency + bar.phase);
      const amplitude = bar.baseAmplitude + wave * 0.3 + Math.random() * 0.1;
      const barHeight = Math.max(10, amplitude * canvas.height);
      
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      gradient.addColorStop(0, '#ff1493');
      gradient.addColorStop(0.5, '#ff69b4');
      gradient.addColorStop(1, '#ffffff');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight);
    }
  }

  // ===== PHẦN 8: EVENT LISTENER CHO CLICK BÀI HÁT =====
  songsListDiv.addEventListener("click", (e) => {
    const card = e.target.closest(".song-card");
    const row = e.target.closest(".song-row");
    
    if (card) {
      const songId = card.dataset.songId;
      const index = currentSongs.findIndex(s => s.song_id === songId);
      if (index !== -1) {
        playSong(index);
      }
    } else if (row) {
      const songId = row.dataset.songId;
      const index = currentSongs.findIndex(s => s.song_id === songId);
      if (index !== -1) {
        playSong(index);
      }
    }
  });

  // ===== PHẦN 9: PLAYER CONTROLS =====
  
  // Play/Pause
  playPauseBtn.addEventListener("click", () => {
    if (isPlaying) {
      player.pause();
      playPauseBtn.textContent = "▶";
      fullscreenPlayPauseBtn.textContent = "▶";
      isPlaying = false;
    } else {
      if (player.src) {
        player.play();
        playPauseBtn.textContent = "⏸";
        fullscreenPlayPauseBtn.textContent = "⏸";
        isPlaying = true;
      }
    }
  });

  // Previous
  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      playSong(currentIndex - 1);
    }
  });

  // Next
  nextBtn.addEventListener("click", () => {
    if (currentIndex < currentSongs.length - 1) {
      playSong(currentIndex + 1);
    }
  });

  // Rewind -10s
  rewindBtn.addEventListener("click", () => {
    player.currentTime = Math.max(0, player.currentTime - 10);
  });

  // Forward +10s
  forwardBtn.addEventListener("click", () => {
    player.currentTime = Math.min(player.duration, player.currentTime + 10);
  });

  // Progress Bar
  progressBar.addEventListener("input", (e) => {
    const value = e.target.value;
    player.currentTime = (value / 100) * player.duration;
  });

  // Update progress bar and time
  player.addEventListener("timeupdate", () => {
    if (player.duration) {
      const percent = (player.currentTime / player.duration) * 100;
      progressBar.value = percent;
      currentTimeEl.textContent = formatTime(player.currentTime);
      durationEl.textContent = formatTime(player.duration);
      
      // Update fullscreen progress
      fullscreenProgressBar.value = percent;
      fullscreenCurrentTime.textContent = formatTime(player.currentTime);
      fullscreenDuration.textContent = formatTime(player.duration);
    }
  });

  // Auto next when song ends
  player.addEventListener("ended", () => {
    if (currentIndex < currentSongs.length - 1) {
      playSong(currentIndex + 1);
    }
  });

  // Hàm format thời gian
  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ===== PHẦN 10: EVENT LISTENER CHO THANH TÌM KIẾM =====
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = searchInput.value;
        handleSearch(query);
      }
    });
  }

  // ===== PHẦN 10.5: CLICK ICON KÍNH LÚP ĐỂ TÌM KIẾM =====
  const searchBox = document.querySelector(".search-box");
  
  if (searchBox && searchInput) {
    searchBox.addEventListener("click", (e) => {
      // Click vào khu vực icon (left < 60px từ trái)
      const rect = searchBox.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      
      if (clickX < 60) {
        e.preventDefault();
        e.stopPropagation();
        const query = searchInput.value.trim();
        
        if (query) {
          // Có text trong input -> Tìm kiếm
          console.log("🔍 Tìm kiếm:", query);
          handleSearch(query);
        } else {
          // Không có text -> Focus vào input
          console.log("✅ Focus vào input...");
          searchInput.focus();
        }
        
        return false;
      }
    });
  }

  // ===== PHẦN 11: KÍCH HOẠT NÚT TẠO PLAYLIST =====
  const createPlaylistBtn = document.getElementById("create-playlist-btn");
  if (createPlaylistBtn) {
    createPlaylistBtn.addEventListener("click", () => {
      const token = localStorage.getItem("minimusic_token");
      if (!token) {
        alert("Bạn cần đăng nhập để xem playlists!");
        window.location.href = "login.html";
        return;
      }
      // Chuyển sang trang quản lý playlists
      window.location.href = "my-playlists.html";
    });
  }

  // ===== PHẦN 12: FULLSCREEN PLAYER CONTROLS =====
  
  // Back button
  backBtn.addEventListener("click", () => {
    fullscreenPlayer.style.display = "none";
    musicPlayerBar.style.display = "flex";
  });
  
  // Fullscreen player controls - Play/Pause
  fullscreenPlayPauseBtn.addEventListener("click", () => {
    if (isPlaying) {
      player.pause();
      fullscreenPlayPauseBtn.textContent = "▶";
      playPauseBtn.textContent = "▶";
      isPlaying = false;
    } else {
      player.play();
      fullscreenPlayPauseBtn.textContent = "⏸";
      playPauseBtn.textContent = "⏸";
      isPlaying = true;
    }
  });
  
  // Fullscreen player controls - Previous
  fullscreenPrevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      playSong(currentIndex - 1);
    }
  });
  
  // Fullscreen player controls - Next
  fullscreenNextBtn.addEventListener("click", () => {
    if (currentIndex < currentSongs.length - 1) {
      playSong(currentIndex + 1);
    }
  });
  
  // Fullscreen player controls - Rewind
  fullscreenRewindBtn.addEventListener("click", () => {
    player.currentTime = Math.max(0, player.currentTime - 10);
  });
  
  // Fullscreen player controls - Forward
  fullscreenForwardBtn.addEventListener("click", () => {
    player.currentTime = Math.min(player.duration, player.currentTime + 10);
  });
  
  // Fullscreen progress bar
  fullscreenProgressBar.addEventListener("input", (e) => {
    const value = e.target.value;
    player.currentTime = (value / 100) * player.duration;
  });

  // ===== PHẦN 13: TỰ ĐỘNG CHẠY KHI TẢI TRANG =====
  fetchPopularSongs();
});
