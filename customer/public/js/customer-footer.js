(() => {
    const footer = document.querySelector("[data-customer-footer]");
    if (!footer) return;

    const page = document.body.dataset.customerPage || "home";
    const home = page === "home" ? "" : "index.html";
    const appointment = page === "home" ? "?appointment=1" : "index.html?appointment=1";
    const favorites = page === "home" ? "?favorites=1#products" : "index.html?favorites=1#products";
    footer.innerHTML = `
        <div class="customer-footer-main store-container">
            <section class="customer-footer-brand" aria-label="Giới thiệu doanh nghiệp">
                <a class="store-brand" href="index.html#home" aria-label="Trang chủ doanh nghiệp"><span class="store-brand-mark" data-brand-mark><i class="fa-solid fa-building" aria-hidden="true"></i><img data-brand-logo alt="" hidden /></span><strong data-brand-name>An Phát Land</strong></a>
                <p>Khám phá dự án và sản phẩm bất động sản. Xem thông tin chi tiết, lưu lựa chọn quan tâm và kết nối với đội ngũ tư vấn.</p>
                <span class="customer-footer-brand-tag"><i class="fa-solid fa-building" aria-hidden="true"></i> Dự án · Căn hộ · Nhà phố · Đất nền</span>
            </section>
            <nav class="customer-footer-column" aria-label="Khám phá">
                <h2>Khám phá</h2>
                <a href="${home}#products">Dự án & sản phẩm</a>
                <a href="${favorites}">Sản phẩm đã lưu</a>
                <a href="articles.html">Cẩm nang bất động sản</a>
            </nav>
            <nav class="customer-footer-column" aria-label="Hỗ trợ khách hàng">
                <h2>Hỗ trợ khách hàng</h2>
                <a href="about.html">Thông tin</a>
                <a href="${home}#how-it-works">Hướng dẫn đặt lịch</a>
                <a href="${appointment}">Gửi yêu cầu tư vấn</a>
            </nav>
            <section class="customer-footer-column customer-footer-contact" aria-label="Thông tin liên hệ">
                <h2>Liên hệ</h2>
                <a class="customer-contact-action" href="contact.html"><i class="fa-solid fa-headset" aria-hidden="true"></i><span>Liên hệ với chúng tôi</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
            </section>
        </div>
        <div class="customer-footer-bottom">
            <div class="store-container customer-footer-bottom-inner">
                <span>© <span id="currentYear">${new Date().getFullYear()}</span> <span data-brand-name>An Phát Land</span>. Bảo lưu mọi quyền.</span>
                <p>Giá, tình trạng và thông tin sản phẩm chỉ mang tính tham khảo; vui lòng xác nhận với doanh nghiệp.</p>
                <a class="customer-footer-top-link" href="${page === "home" ? "#home" : "index.html#home"}">Về đầu trang <i class="fa-solid fa-arrow-up" aria-hidden="true"></i></a>
            </div>
        </div>`;

    let company = {
        fields: {
            displayName: "An Phát Land",
            phone: "028 7300 6868",
            email: "contact@anphatland.vn",
            website: "https://anphatland.vn",
            address: "Tầng 12, 125 Nguyễn Huệ, Phường Sài Gòn, TP. Hồ Chí Minh",
        },
        logo: "",
    };
    try {
        const saved = JSON.parse(null || "null");
        if (saved?.fields) company = { ...company, ...saved, fields: { ...company.fields, ...saved.fields } };
    } catch { /* Dùng thông tin doanh nghiệp mặc định. */ }

    const fields = company.fields;
    document.querySelectorAll("[data-brand-name]").forEach((element) => { element.textContent = fields.displayName || "Doanh nghiệp bất động sản"; });
    document.querySelectorAll("[data-brand-mark]").forEach((mark) => {
        const logo = mark.querySelector("[data-brand-logo]");
        if (company.logo && logo) {
            logo.src = company.logo;
            logo.hidden = false;
            mark.querySelector("i")?.setAttribute("hidden", "");
        }
    });
})();

