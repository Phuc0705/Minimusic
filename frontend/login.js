document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const messageEl = document.getElementById("message");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Ngăn form tự gửi

    // 1. Lấy email, password
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      // 2. Gửi lên API /api/login
      const response = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Nếu đăng nhập thành công
        messageEl.textContent = data.message;
        messageEl.style.color = "green";

        // 3. LƯU "VÉ" VÀO TRÌNH DUYỆT (Rất quan trọng)
        localStorage.setItem("minimusic_token", data.token);
        // Lưu cả thông tin user nếu muốn
        localStorage.setItem("minimusic_user", JSON.stringify(data.user));

        // 4. Chuyển về trang chủ sau 1 giây
        setTimeout(() => {
          window.location.href = "index.html"; // Chuyển về trang chủ
        }, 1000);
      } else {
        // Nếu đăng nhập sai
        messageEl.textContent = data.message;
        messageEl.style.color = "red";
      }
    } catch (error) {
      console.error("Lỗi:", error);
      messageEl.textContent = "Không thể kết nối tới server.";
      messageEl.style.color = "red";
    }
  });
});
