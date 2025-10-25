// Chờ cho toàn bộ trang HTML tải xong rồi mới chạy code
document.addEventListener("DOMContentLoaded", () => {
  // Lấy các phần tử (elements) từ HTML
  const registerForm = document.getElementById("register-form");
  const submitButton = document.getElementById("submit-button");
  const messageEl = document.getElementById("message");

  // Lắng nghe sự kiện "submit" (khi người dùng bấm nút "Đăng ký")
  registerForm.addEventListener("submit", async (e) => {
    // Ngăn trình duyệt tự tải lại trang (hành vi mặc định của form)
    e.preventDefault();

    // 1. Lấy giá trị từ các ô input
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // 2. Gói dữ liệu lại thành một đối tượng JSON
    const userData = {
      username: username,
      email: email,
      password: password,
    };

    // 3. Gửi dữ liệu lên API Backend (http://localhost:3001/api/register)
    try {
      const response = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData), // Chuyển JS object thành chuỗi JSON
      });

      // 4. Nhận kết quả trả về từ server
      const data = await response.json();

      if (response.ok) {
        // Nếu server trả về 2xx (thành công)
        messageEl.textContent = data.message;
        messageEl.style.color = "green";

        // Vô hiệu hóa nút để tránh bấm nhiều lần
        submitButton.disabled = true;

        // Chờ 2 giây rồi tự chuyển sang trang đăng nhập
        setTimeout(() => {
          window.location.href = "login.html"; // (Trang này mình sẽ tạo sau)
        }, 2000);
      } else {
        // Nếu server trả về lỗi (400, 500)
        messageEl.textContent = data.message; // Hiển thị lỗi (vd: "Email đã tồn tại")
        messageEl.style.color = "red";
      }
    } catch (error) {
      console.error("Có lỗi xảy ra:", error);
      messageEl.textContent = "Không thể kết nối tới server. Vui lòng thử lại.";
      messageEl.style.color = "red";
    }
  });
});
