const contactForm = document.querySelector("#contactForm");

if (contactForm) {
    const requestedInterest = new URLSearchParams(window.location.search).get(
        "interest",
    );
    const interestField = contactForm.querySelector('[name="interest"]');
    if (
        requestedInterest &&
        interestField &&
        [...interestField.options].some(
            (option) => option.value === requestedInterest,
        )
    ) {
        interestField.value = requestedInterest;
    }

    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const status = contactForm.querySelector("#formNote");
        status.textContent =
            "Bạn đã nhập xong thông tin. Đây là bản dùng thử, thông tin chưa được gửi đến LANDIFORM.";
    });
}
