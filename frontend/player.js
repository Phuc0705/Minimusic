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
  
  // Waveform canvas
  const waveformCanvas = document.getElementById("waveform-canvas");
  
  let currentSong = null;
  let currentQueue = [];
  let isPlaying = false;
  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let animationFrameId = null;
  
  // Player states
  let isShuffled = false;
  let repeatMode = 'off'; // 'off', 'one', 'all'
  
  // ===== CHECK ĐĂNG NHẬP =====
  if (token && userString) {
    const user = JSON.parse(userString);
    const navUsername = document.getElementById("nav-username");
    const logoutButton = document.getElementById("logout-button");
    
    navUsername.textContent = user.username;
    navUsername.style.display = "inline-block";
    logoutButton.style.display = "inline-block";
    
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("minimusic_token");
      localStorage.removeItem("minimusic_user");
      window.location.href = "index.html";
    });
  }
  
  // ===== LOAD THÔNG TIN BÀI HÁT TỪ LOCAL STORAGE =====
  function loadCurrentSong() {
    const songData = localStorage.getItem("currentSong");
    const queueData = localStorage.getItem("currentQueue");
    
    if (songData) {
      currentSong = JSON.parse(songData);
      updateUI(currentSong);
      // Tự động phát nhạc
      playSong();
    } else {
      // Nếu không có bài hát, quay về trang chủ
      alert("Không có bài hát nào để phát!");
      window.location.href = "index.html";
      return;
    }
    
    if (queueData) {
      currentQueue = JSON.parse(queueData);
      renderQueue();
    } else {
      // Nếu không có queue, tự load popular songs
      loadPopularForQueue();
    }
    
    // Load albums tương tự
    loadSimilarAlbums();
    loadMightLikeAlbums();
  }
  
  // ===== CẬP NHẬT UI =====
  function updateUI(song) {
    currentAlbumArt.src = song.cover_art_url;
    currentArtist.textContent = song.artist_name;
    currentTitle.textContent = song.title;
    
    player.src = song.file_url;
  }
  
  // ===== PHÁT NHẠC =====
  function playSong() {
    if (!currentSong) return;
    
    player.play().then(() => {
      isPlaying = true;
      playSongBtn.textContent = "⏸ TẠM DỪNG";
      playSongBtn.classList.add("playing");
      
      // Setup audio context cho waveform
      setupAudioContext();
      animateWaveform();
      
      loadArtistInfo(currentSong.artist_name);
    }).catch(err => {
      console.error("Lỗi phát nhạc:", err);
    });
  }
  
  // ===== SETUP AUDIO CONTEXT =====
  function setupAudioContext() {
    try {
      if (!audioContext) {
        // Không setup audio context vì CORS với Jamendo
        // Dùng fake waveform thay thế
        console.log("Sử dụng fake waveform do CORS");
        audioContext = null;
        analyser = null;
        dataArray = null;
      }
    } catch (err) {
      console.error("Lỗi setup audio context:", err);
      audioContext = null;
      analyser = null;
      dataArray = null;
    }
  }
  
  // Waveform data
  let waveformBars = [];
  let waveformFrame = 0;
  
  // ===== ANIMATE WAVEFORM =====
  function animateWaveform() {
    if (!waveformCanvas || !isPlaying) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      return;
    }
    
    const canvas = waveformCanvas;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw animated waveform
    drawAnimatedWaveform(ctx, canvas);
    
    animationFrameId = requestAnimationFrame(animateWaveform);
  }
  
  // ===== DRAW ANIMATED WAVEFORM =====
  function drawAnimatedWaveform(ctx, canvas) {
    const numBars = 80;
    const barWidth = canvas.width / numBars;
    const centerY = canvas.height / 2;
    const maxBarHeight = canvas.height * 0.4; // Giới hạn chiều cao để phù hợp với kích thước nhỏ
    
    waveformFrame++;
    
    // Initialize bars data if needed
    if (waveformBars.length === 0) {
      for (let i = 0; i < numBars; i++) {
        waveformBars.push({
          baseHeight: Math.random() * 15 + 8,
          phase: Math.random() * Math.PI * 2,
          speed: 0.1 + Math.random() * 0.1
        });
      }
    }
    
    // Draw waveform
    for (let i = 0; i < numBars; i++) {
      const bar = waveformBars[i];
      
      // Calculate animated height with sine wave
      const wave = Math.sin(waveformFrame * bar.speed + bar.phase) * 0.5 + 0.5;
      const animatedHeight = Math.min(bar.baseHeight + (wave * 8) + Math.random() * 3, maxBarHeight);
      
      // Create beautiful gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#00ff88');
      gradient.addColorStop(0.5, '#00d4ff');
      gradient.addColorStop(1, '#0088ff');
      
      // Add subtle glow effect
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#00ff88';
      
      ctx.fillStyle = gradient;
      
      // Draw bars (top and bottom mirrored)
      const x = i * barWidth + 1;
      const y1 = centerY - animatedHeight;
      const y2 = centerY;
      const barHeight = animatedHeight;
      
      ctx.fillRect(x, y1, barWidth - 2, barHeight);
      ctx.fillRect(x, y2, barWidth - 2, barHeight);
      
      // Remove glow
      ctx.shadowBlur = 0;
    }
  }
  
  // ===== LOAD QUEUE TỪ POPULAR SONGS =====
  async function loadPopularForQueue() {
    try {
      const response = await fetch("http://localhost:3001/api/songs/popular");
      if (!response.ok) throw new Error("Failed to load");
      const songs = await response.json();
      
      currentQueue = songs.slice(0, 10); // Lấy 10 bài đầu
      renderQueue();
    } catch (error) {
      console.error("Lỗi load queue:", error);
    }
  }
  
  // ===== RENDER QUEUE =====
  function renderQueue() {
    if (!nextQueue || !currentSong) return;
    nextQueue.innerHTML = "";
    
    // Tìm index của bài hát đang phát trong queue
    const currentIndex = currentQueue.findIndex(s => s.song_id === currentSong.song_id);
    
    // Lấy các bài hát tiếp theo (5 bài)
    const nextSongs = currentQueue.slice(currentIndex + 1, currentIndex + 6);
    
    nextSongs.forEach((song) => {
      const queueItem = document.createElement("div");
      queueItem.className = "queue-item";
      
      queueItem.innerHTML = `
        <img src="${song.cover_art_url}" alt="${song.title}">
        <span>${song.title}</span>
      `;
      
      queueItem.addEventListener("click", () => {
        currentSong = song;
        updateUI(song);
        playSong();
        
        // Re-render queue
        renderQueue();
      });
      
      nextQueue.appendChild(queueItem);
    });
  }
  
  // ===== LOAD SIMILAR ALBUMS =====
  async function loadSimilarAlbums() {
    try {
      const response = await fetch("http://localhost:3001/api/songs/popular?limit=6");
      if (!response.ok) throw new Error("Failed to load");
      const songs = await response.json();
      
      renderAlbums(songs, albumsLikeGrid);
    } catch (error) {
      console.error("Lỗi load similar albums:", error);
    }
  }
  
  // ===== LOAD MIGHT LIKE ALBUMS =====
  async function loadMightLikeAlbums() {
    try {
      const response = await fetch("http://localhost:3001/api/songs/popular?limit=6");
      if (!response.ok) throw new Error("Failed to load");
      const songs = await response.json();
      
      renderAlbums(songs, albumsMightGrid);
    } catch (error) {
      console.error("Lỗi load might like albums:", error);
    }
  }
  
  // ===== RENDER ALBUMS GRID =====
  function renderAlbums(songs, gridElement) {
    if (!gridElement) return;
    gridElement.innerHTML = "";
    
    songs.forEach(song => {
      const albumCard = document.createElement("div");
      albumCard.className = "album-card";
      
      albumCard.innerHTML = `
        <img src="${song.cover_art_url}" alt="${song.title}">
        <h4>${song.title}</h4>
        <p>${song.artist_name}</p>
      `;
      
      albumCard.addEventListener("click", () => {
        currentSong = song;
        updateUI(song);
        playSong();
      });
      
      gridElement.appendChild(albumCard);
    });
  }
  
  // ===== LOAD ARTIST INFO =====
  function loadArtistInfo(artistName) {
    // Tạm thời dùng thông tin giả
    artistImage.src = currentAlbumArt.src;
    artistName.textContent = artistName;
    artistAge.textContent = "Age: Unknown";
    artistListeners.textContent = "Unknown monthly listeners";
    artistBio.textContent = `About ${artistName}: Information about this artist will be loaded from database.`;
  }
  
  // ===== EVENT LISTENERS =====
  
  // Play/Pause Button
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
  
  // Add to Playlist Button
  if (addToPlaylistBtn) {
    addToPlaylistBtn.addEventListener("click", () => {
      if (!token) {
        alert("Vui lòng đăng nhập!");
        window.location.href = "login.html";
        return;
      }
      alert("Tính năng thêm vào playlist đang phát triển!");
    });
  }
  
  // ===== CONTROL BUTTONS =====
  const shuffleBtn = document.getElementById("shuffle-btn");
  const prevSongBtn = document.getElementById("prev-song-btn");
  const rewind10sBtn = document.getElementById("rewind-10s-btn");
  const forward10sBtn = document.getElementById("forward-10s-btn");
  const nextSongBtn = document.getElementById("next-song-btn");
  const repeatBtn = document.getElementById("repeat-btn");
  
  // Shuffle Button
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      isShuffled = !isShuffled;
      shuffleBtn.classList.toggle("active", isShuffled);
      
      if (isShuffled) {
        // Shuffle queue
        const shuffledQueue = [...currentQueue];
        for (let i = shuffledQueue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
        }
        currentQueue = shuffledQueue;
        renderQueue();
      }
    });
  }
  
  // Previous Song Button
  if (prevSongBtn) {
    prevSongBtn.addEventListener("click", () => {
      const currentIndex = currentQueue.findIndex(s => s.song_id === currentSong.song_id);
      
      if (currentIndex > 0) {
        currentSong = currentQueue[currentIndex - 1];
        updateUI(currentSong);
        playSong();
        renderQueue();
      }
    });
  }
  
  // Rewind 10s Button
  if (rewind10sBtn) {
    rewind10sBtn.addEventListener("click", () => {
      player.currentTime = Math.max(0, player.currentTime - 10);
    });
  }
  
  // Forward 10s Button
  if (forward10sBtn) {
    forward10sBtn.addEventListener("click", () => {
      player.currentTime = Math.min(player.duration, player.currentTime + 10);
    });
  }
  
  // Next Song Button
  if (nextSongBtn) {
    nextSongBtn.addEventListener("click", () => {
      const currentIndex = currentQueue.findIndex(s => s.song_id === currentSong.song_id);
      
      if (currentIndex >= 0 && currentIndex < currentQueue.length - 1) {
        currentSong = currentQueue[currentIndex + 1];
        updateUI(currentSong);
        playSong();
        renderQueue();
      } else if (repeatMode === 'all' && currentQueue.length > 0) {
        // Loop back to first song
        currentSong = currentQueue[0];
        updateUI(currentSong);
        playSong();
        renderQueue();
      }
    });
  }
  
  // Repeat Button
  if (repeatBtn) {
    repeatBtn.addEventListener("click", () => {
      if (repeatMode === 'off') {
        repeatMode = 'one';
        repeatBtn.classList.add("active");
        repeatBtn.textContent = "🔂"; // One repeat
      } else if (repeatMode === 'one') {
        repeatMode = 'all';
        repeatBtn.textContent = "🔁"; // All repeat
      } else {
        repeatMode = 'off';
        repeatBtn.classList.remove("active");
        repeatBtn.textContent = "🔁";
      }
    });
  }
  
  // Progress Bar
  if (mainProgressBar) {
    mainProgressBar.addEventListener("input", (e) => {
      const value = e.target.value;
      if (player.duration) {
        player.currentTime = (value / 100) * player.duration;
      }
    });
  }
  
  // Update Progress
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
      // Handle repeat mode
      if (repeatMode === 'one') {
        // Repeat current song
        player.currentTime = 0;
        player.play();
        return;
      }
      
      // Auto play next song
      const currentIndex = currentQueue.findIndex(s => s.song_id === currentSong.song_id);
      
      if (currentIndex >= 0 && currentIndex < currentQueue.length - 1) {
        // Có bài tiếp theo
        currentSong = currentQueue[currentIndex + 1];
        updateUI(currentSong);
        playSong();
        
        // Re-render queue
        renderQueue();
      } else if (repeatMode === 'all' && currentQueue.length > 0) {
        // Loop back to first song
        currentSong = currentQueue[0];
        updateUI(currentSong);
        playSong();
        renderQueue();
      }
    });
  }
  
  // ===== HELPER FUNCTIONS =====
  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // ===== LOAD DATA =====
  loadCurrentSong();
  
  // ===== SEARCH FUNCTIONALITY =====
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `index.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
    
    // Click icon to search
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

