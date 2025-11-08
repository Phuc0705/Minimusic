document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let albumId = urlParams.get("id");
  const albumName = decodeURIComponent(urlParams.get("name") || "Album");

  // SỬA LỖI: loại bỏ ký tự thừa
  if (albumId) albumId = albumId.replace(/[^0-9]/g, '');
  if (!albumId || albumId === "") {
    document.body.innerHTML = "<h2 style='text-align:center;color:red;'>ID album không hợp lệ!</h2>";
    return;
  }

  // Cập nhật UI ngay
  document.getElementById("album-name").textContent = albumName;
  document.title = `${albumName} - MiniMusic`;
  document.getElementById("album-image").src = "https://via.placeholder.com/200x200/333333/FFFFFF?text=" + encodeURIComponent(albumName.charAt(0));

  const list = document.getElementById("album-songs-list");

  try {
    const res = await fetch(`http://localhost:3001/api/albums/${albumId}/tracks`);
    
    // XỬ LÝ 404 → album không có bài hát
    if (res.status === 404 || !res.ok) {
      list.innerHTML = "<p style='text-align:center; color:#aaa; padding:20px;'>Album này chưa có bài hát nào trên Jamendo.</p>";
      return;
    }

    const songs = await res.json();

    if (songs.length === 0) {
      list.innerHTML = "<p style='text-align:center; color:#aaa; padding:20px;'>Không có bài hát nào trong album này.</p>";
      return;
    }

    // Render danh sách
    list.innerHTML = songs.map((s, i) => `
      <div class="song-card" data-index="${i}" style="cursor:pointer; padding:12px; border-radius:8px; margin:8px 0; background:#1a1a1a; display:flex; align-items:center;">
        <span style="width:30px; color:#aaa;">${i+1}</span>
        <img src="${s.cover_art_url}" alt="" style="width:50px; height:50px; border-radius:6px; margin:0 12px;" onerror="this.src='https://via.placeholder.com/50x50/333333/FFFFFF?text=?'">
        <div style="flex:1; overflow:hidden;">
          <h4 style="margin:0; font-size:1em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.title}</h4>
          <p style="margin:4px 0 0; color:#aaa; font-size:0.9em;">${s.artist_name}</p>
        </div>
      </div>
    `).join("");

    // Click để phát
    list.addEventListener("click", (e) => {
      const card = e.target.closest(".song-card");
      if (card) {
        const index = card.dataset.index;
        localStorage.setItem("currentSong", JSON.stringify(songs[index]));
        localStorage.setItem("currentQueue", JSON.stringify(songs));
        localStorage.setItem("currentIndex", index);
        window.location.href = "player.html";
      }
    });

  } catch (error) {
    console.error("Lỗi tải album:", error);
    list.innerHTML = `<p style="color:red; text-align:center;">Lỗi kết nối server.</p>`;
  }
});