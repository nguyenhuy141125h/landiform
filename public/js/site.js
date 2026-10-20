const navItems = [
    { page: "home", label: "Trang chủ", href: "index.html" },
    { page: "solutions", label: "Giải pháp", href: "solutions.html" },
    { page: "pricing", label: "Bảng giá", href: "pricing.html" },
    { page: "about", label: "Về LANDIFORM", href: "about.html" },
    { page: "contact", label: "Liên hệ", href: "contact.html" },
];

class SiteHeader extends HTMLElement {
    connectedCallback() {
        const active = this.getAttribute("active");
        const links = navItems
            .map(
                ({ page, label, href }) =>
                    `<a href="${href}"${active === page ? ' class="is-active" aria-current="page"' : ""}>${label}</a>`,
            )
            .join("");
        this.innerHTML = `
      <header class="site-header">
        <div class="container header-inner">
          <a class="brand" href="index.html" aria-label="LANDIFORM, về trang chủ">
            <img class="brand-logo" src="assets/logo.png" alt="LANDIFORM" />
          </a>
          <button class="menu-toggle" type="button" aria-label="Mở menu" aria-controls="main-navigation" aria-expanded="false"><i class="fa-solid fa-bars" aria-hidden="true"></i></button>
          <nav class="main-nav" id="main-navigation" aria-label="Điều hướng chính">${links}<a class="nav-mobile-cta" href="#consultation-modal" data-consultation-open>Đăng ký tư vấn <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></nav>
          <a class="btn btn-primary header-cta" href="#consultation-modal" data-consultation-open>Đăng ký tư vấn <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
        </div>
      </header>`;
        const toggle = this.querySelector(".menu-toggle");
        const nav = this.querySelector(".main-nav");
        const closeMenu = () => {
            nav.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Mở menu");
            toggle.innerHTML =
                '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
        };
        toggle.addEventListener("click", () => {
            const open = nav.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(open));
            toggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
            toggle.innerHTML = `<i class="fa-solid fa-${open ? "xmark" : "bars"}" aria-hidden="true"></i>`;
        });
        nav.querySelectorAll("a").forEach((link) =>
            link.addEventListener("click", closeMenu),
        );
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeMenu();
        });
    }
}

class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-brandline">
          <a class="brand brand-light" href="index.html" aria-label="LANDIFORM, về trang chủ"><img class="brand-logo" src="assets/logo.png" alt="LANDIFORM" /></a>
          <p>Website dự án, thông tin khách hàng và công việc của đội ngũ trong một hành trình rõ ràng.</p>
        </div>
        <div class="container footer-top">
          <div class="footer-links">
            <h2>LANDIFORM</h2>
            <a href="index.html">Trang chủ</a>
            <a href="about.html">Về LANDIFORM</a>
            <a href="pricing.html">Bảng giá tham khảo</a>
          </div>
          <div class="footer-links">
            <h2>GIẢI PHÁP</h2>
            <a href="solutions.html#scenarios">Theo từng loại dự án</a>
            <a href="solutions.html#journey">Hành trình khách hàng</a>
            <a href="solutions.html#architecture">Thông tin theo dự án</a>
          </div>
          <div class="footer-links">
            <h2>CHỨC NĂNG</h2>
            <a href="solutions.html#sites">Website dự án</a>
            <a href="solutions.html#forms">Biểu mẫu và mã QR</a>
            <a href="solutions.html#crm">Hồ sơ khách hàng</a>
            <a href="solutions.html#flow">Công việc và nhắc lịch</a>
            <a href="solutions.html#data">Báo cáo hoạt động</a>
          </div>
          <div class="footer-contact">
            <h2>TRAO ĐỔI CÙNG LANDIFORM</h2>
            <p>Chia sẻ nhu cầu để cùng chọn cách bắt đầu phù hợp với các dự án của doanh nghiệp.</p>
            <a class="btn btn-white" href="contact.html#contact-details">Liên hệ LANDIFORM <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
            <div class="footer-social" role="group" aria-label="Các kênh mạng xã hội">
              <span class="footer-social-item" role="img" aria-label="Facebook" title="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.4 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.2V13H10v8z" /></svg></span>
              <span class="footer-social-item" role="img" aria-label="Instagram" title="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2" /><circle cx="17.5" cy="6.8" r="1.2" /></svg></span>
              <span class="footer-social-item" role="img" aria-label="YouTube" title="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2" /><path d="m10 9 5 3-5 3z" /></svg></span>
              <span class="footer-social-item" role="img" aria-label="LinkedIn" title="LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4M3.3 10h3.4v10.7H3.3zM9 10h3.3v1.5h.1a3.7 3.7 0 0 1 3.4-1.9c3.6 0 4.2 2.3 4.2 5.2v5.9h-3.4v-5.2c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.3H9z" /></svg></span>
            </div>
          </div>
        </div>
        <div class="container footer-bottom"><span>© 2026 LANDIFORM. Bảo lưu mọi quyền.</span><span>Quản lý website, khách hàng và công việc ở nhiều dự án.</span></div>
      </footer>`;
    }
}

customElements.define("site-header", SiteHeader);
customElements.define("site-footer", SiteFooter);

function installConsultationModal() {
    document.body.insertAdjacentHTML(
        "beforeend",
        `
    <div class="consultation-modal" id="consultation-modal" aria-hidden="true" inert>
      <button class="consultation-backdrop" type="button" data-consultation-close tabindex="-1" aria-label="Đóng hộp đăng ký"></button>
      <section class="consultation-dialog" role="dialog" aria-modal="true" aria-labelledby="consultation-title" tabindex="-1">
        <button class="consultation-close" type="button" data-consultation-close aria-label="Đóng"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        <div class="consultation-heading"><span class="consultation-brand"><img src="assets/logo.png" alt="LANDIFORM" /></span><h2 id="consultation-title">Đăng ký tư vấn LANDIFORM</h2><p>Tìm hiểu LANDIFORM phù hợp với doanh nghiệp của bạn.</p></div>
        <ol class="consultation-steps" aria-label="Các bước đăng ký"><li class="is-current" data-step-indicator="1"><span>1</span><b>Liên hệ</b></li><li data-step-indicator="2"><span>2</span><b>Nhu cầu</b></li><li data-step-indicator="3"><span>3</span><b>Hoàn tất</b></li></ol>
        <form class="consultation-form" novalidate>
          <div class="consultation-panel" data-step="1"><h3>Thông tin của bạn</h3><p>Cho chúng tôi biết thông tin về bạn</p><label>Họ và tên<input name="fullName" autocomplete="name" placeholder="Họ tên" required /></label><label>Số điện thoại<input name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="0912 345 678" required /></label><div class="consultation-actions"><span></span><button class="btn btn-primary" type="button" data-step-next>Tiếp theo <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></div></div>
          <div class="consultation-panel" data-step="2" hidden><h3>Nhu cầu của doanh nghiệp</h3><p>Chọn nội dung bạn muốn trao đổi.</p><label>Tên doanh nghiệp<input name="company" autocomplete="organization" placeholder="Tên công ty hoặc chủ đầu tư" required /></label><label>Email liên hệ<input name="email" type="email" autocomplete="email" placeholder="ten@congty.vn" required /></label><label>Nội dung cần tư vấn<select name="interest" required><option value="">Chọn nhu cầu phù hợp</option><option>Tạo hoặc cập nhật website cho dự án</option><option>Nhận đăng ký qua website và mã QR</option><option>Lưu hồ sơ và theo dõi chăm sóc khách hàng</option><option>Phân công công việc và nhắc lịch cho đội ngũ</option><option>Theo dõi kết quả hoạt động của các dự án</option><option>Kết hợp nhiều chức năng theo nhu cầu</option></select></label><div class="consultation-actions"><button class="btn btn-quiet" type="button" data-step-back><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Quay lại</button><button class="btn btn-primary" type="submit">Hoàn tất <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></div></div>
          <div class="consultation-panel consultation-success" data-step="3" hidden><span class="success-mark"><i class="fa-solid fa-check" aria-hidden="true"></i></span><h3>Cảm ơn bạn!</h3><p>Bạn đã hoàn tất thông tin tư vấn.</p><button class="btn btn-primary" type="button" data-consultation-close>Đóng cửa sổ</button></div>
        </form>
      </section>
    </div>`,
    );

    const modal = document.querySelector(".consultation-modal");
    const dialog = modal.querySelector(".consultation-dialog");
    const form = modal.querySelector(".consultation-form");
    let opener = null;
    let originalPadding = "";
    let step = 1;
    const setStep = (value, moveFocus = false) => {
        step = value;
        modal.querySelectorAll("[data-step]").forEach((panel) => {
            panel.hidden = Number(panel.dataset.step) !== step;
        });
        modal.querySelectorAll("[data-step-indicator]").forEach((item) => {
            const itemStep = Number(item.dataset.stepIndicator);
            item.classList.toggle("is-current", itemStep === step);
            item.classList.toggle("is-done", itemStep < step);
        });
        if (moveFocus) {
            modal
                .querySelector(
                    `[data-step="${step}"] input, [data-step="${step}"] select, [data-step="${step}"] button`,
                )
                ?.focus();
        }
    };
    const open = (source) => {
        opener = source;
        form.reset();
        setStep(1);
        originalPadding = document.body.style.paddingRight;
        const gap = window.innerWidth - document.documentElement.clientWidth;
        if (gap > 0) document.body.style.paddingRight = `${gap}px`;
        document.body.classList.add("modal-open");
        modal.inert = false;
        modal.setAttribute("aria-hidden", "false");
        requestAnimationFrame(() =>
            requestAnimationFrame(() => modal.classList.add("is-open")),
        );
        dialog.focus({ preventScroll: true });
    };
    const close = () => {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        modal.inert = true;
        document.body.classList.remove("modal-open");
        document.body.style.paddingRight = originalPadding;
        if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
    document.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-consultation-open]");
        if (trigger) {
            event.preventDefault();
            open(trigger);
            return;
        }
        if (event.target.closest("[data-consultation-close]")) close();
    });
    modal.querySelector("[data-step-next]").addEventListener("click", () => {
        const invalid = [
            ...modal.querySelectorAll('[data-step="1"] input'),
        ].find((field) => !field.reportValidity());
        if (!invalid) setStep(2, true);
    });
    modal
        .querySelector("[data-step-back]")
        .addEventListener("click", () => setStep(1, true));
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const invalid = [
            ...modal.querySelectorAll(
                '[data-step="2"] input, [data-step="2"] select',
            ),
        ].find((field) => !field.reportValidity());
        if (!invalid) setStep(3, true);
    });
    document.addEventListener("keydown", (event) => {
        if (!modal.classList.contains("is-open")) return;
        if (event.key === "Escape") {
            close();
            return;
        }
        if (event.key !== "Tab") return;
        const focusable = [
            ...dialog.querySelectorAll(
                "button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]",
            ),
        ].filter(
            (item) => !item.closest("[hidden]") && item.offsetParent !== null,
        );
        if (!focusable.length) return;
        const first = focusable[0],
            last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
}

installConsultationModal();
