document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let artistId = urlParams.get("id");
  const artistName = decodeURIComponent(urlParams.get("name") || "");

  // SỬA LỖI: loại bỏ ký tự thừa từ ID
  if (artistId) {
    artistId = artistId.replace(/[^0-9]/g, ""); // Chỉ giữ số
  }

  if (!artistId || artistId === "") {
    document.body.innerHTML =
      "<h2 style='text-align:center;color:red;'>ID nghệ sĩ không hợp lệ!</h2>";
    return;
  }

  // Cập nhật tiêu đề
  document.getElementById("artist-title").textContent =
    artistName || "Đang tải...";
  document.title = `${artistName || "Nghệ sĩ"} - MiniMusic`;

  const songsList = document.getElementById("artist-songs-list");
  const artistImage = document.getElementById("artist-image");

  try {
    // 1. LẤY THÔNG TIN NGHỆ SĨ
    const artistRes = await fetch(
      `http://localhost:3001/api/artists/${artistId}`
    );
    if (!artistRes.ok) {
      const errText = await artistRes.text();
      console.error("API trả về lỗi:", errText);
      throw new Error("Không tìm thấy nghệ sĩ");
    }
    const artist = await artistRes.json();
    artistImage.src =
      artist.image ||
      `https://via.placeholder.com/200x200/333333/FFFFFF?text=${encodeURIComponent(
        artist.name.charAt(0)
      )}`;
    document.getElementById("artist-title").textContent = artist.name;

    // 2. LẤY BÀI HÁT
    const tracksRes = await fetch(
      `http://localhost:3001/api/artists/${artistId}/tracks`
    );
    if (!tracksRes.ok) throw new Error("Lỗi tải bài hát");

    const songs = await tracksRes.json();
    if (songs.length === 0) {
      songsList.innerHTML =
        "<p style='text-align:center; color:#aaa;'>Không có bài hát nào.</p>";
      return;
    }

    // Render bài hát
    songsList.innerHTML = songs
      .map(
        (s, i) => `
      <div class="song-card" data-index="${i}" style="cursor: pointer; padding: 12px; border-radius: 8px; margin: 8px 0; background: #1a1a1a; display: flex; align-items: center;">
        <img src="${s.cover_art_url}" alt="${s.title}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover; margin-right: 12px;">
        <div style="flex: 1; overflow: hidden;">
          <h4 style="margin: 0; font-size: 1em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.title}</h4>
          <p style="margin: 4px 0 0; color: #aaa; font-size: 0.9em;">${s.artist_name}</p>
        </div>
      </div>
    `
      )
      .join("");

    // Click bài hát → phát
    songsList.addEventListener("click", (e) => {
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
    console.error("Lỗi khi tải trang nghệ sĩ:", error);
    document.body.innerHTML = `<h2 style="text-align:center;color:red;">Lỗi: ${error.message}</h2>`;
  }
});
