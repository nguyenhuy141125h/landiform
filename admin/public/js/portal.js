(() => {
    const button = document.querySelector("#supportRequest");
    if (!button) return;
    button.addEventListener("click", () => {
        window.location.href = "pages/support.html";
    });
})();
