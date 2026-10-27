(() => {
    const mount = document.querySelector("[data-customer-header]");
    if (!mount) return;

    const page = document.body.dataset.customerPage || "home";
    const isHome = page === "home";
    const base = isHome ? "" : "index.html";
    const navItems = [
        ["products", "Sản phẩm", `${base}#products`],
        ["articles", "Cẩm nang", "articles.html"],
        ["about", "Thông tin", "about.html"],
        ["contact", "Liên hệ", "contact.html"],
    ];
    const navigation = navItems.map(([key, label, href]) => {
        const id = key === "products" ? ' id="projectNavLink"' : "";
        return `<a${id} href="${href}" data-nav-key="${key}">${label}</a>`;
    }).join("");

    const favoriteHref = isHome ? "?favorites=1#products" : "index.html?favorites=1#products";
    const appointmentHref = isHome ? "?appointment=1" : "index.html?appointment=1";
    mount.innerHTML = `<a class="store-brand" href="index.html#home" aria-label="Trang chủ doanh nghiệp"><span class="store-brand-mark" data-brand-mark><i class="fa-solid fa-building" aria-hidden="true"></i><img data-brand-logo alt="" hidden /></span><strong data-brand-name>An Phát Land</strong></a><nav class="store-nav" aria-label="Điều hướng chính">${navigation}</nav><div class="store-header-actions"><a class="favorite-shortcut" id="showFavorites" href="${favoriteHref}" aria-label="Xem sản phẩm đã lưu"><svg class="favorite-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg><span>Đã lưu</span><b id="favoriteCount">0</b></a><a class="button button-primary header-appointment" href="${appointmentHref}" data-open-appointment><svg class="calendar-action-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8.5 15l2 2 5-5"/></svg> Đặt lịch tư vấn</a><button class="store-menu-toggle" id="storeMenuToggle" type="button" aria-label="Mở menu" aria-expanded="false"><i class="fa-solid fa-bars" aria-hidden="true"></i></button></div>`;

    const navLinks = [...mount.querySelectorAll("[data-nav-key]")];
    const knownPages = new Set(["articles", "about", "contact"]);
    const hashToKey = { products: "products", contact: "contact" };
    function setActive(key) {
        navLinks.forEach((link) => {
            const active = link.dataset.navKey === key;
            link.classList.toggle("is-active", active);
            if (active) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
    }
    function syncActiveFromLocation() {
        if (page === "about") return setActive("about");
        if (knownPages.has(page)) return setActive(page);
        if (page === "detail") return setActive("products");
        if (new URLSearchParams(window.location.search).has("project") && ["", "#home"].includes(window.location.hash)) return setActive("products");
        setActive(hashToKey[window.location.hash.slice(1)] || "");
    }
    syncActiveFromLocation();
    navLinks.forEach((link) => link.addEventListener("click", () => setActive(link.dataset.navKey)));
    window.addEventListener("hashchange", syncActiveFromLocation);

    try {
        const savedCompany = JSON.parse(null || "null");
        const tenantName = savedCompany?.fields?.displayName || "An Phát Land";
        const tenantId = savedCompany?.fields?.taxCode || tenantName;
        const tenantKey = String(tenantId).toLocaleLowerCase("vi").replace(/[^\p{L}\p{N}]+/gu, "-");
        const savedProducts = JSON.parse(null || "[]");
        document.querySelector("#favoriteCount").textContent = String(Array.isArray(savedProducts) ? savedProducts.length : 0);
    } catch { /* Bộ đếm vẫn hiển thị 0 nếu bộ nhớ trình duyệt không khả dụng. */ }
})();

