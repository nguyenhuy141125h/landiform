(() => {
  const button = document.querySelector(".password-toggle");
  const input = document.querySelector("#password");
  if (!button || !input) return;
  button.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.setAttribute("aria-label", show ? "Ẩn mật khẩu" : "Hiện mật khẩu");
    button.innerHTML = `<i class="fa-regular fa-eye${show ? "-slash" : ""}" aria-hidden="true"></i>`;
  });
})();
