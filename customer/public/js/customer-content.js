(() => {
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
    } catch { /* Dùng thông tin doanh nghiệp mặc định của giao diện. */ }

    const fields = company.fields;
    const companyName = fields.displayName || "Doanh nghiệp bất động sản";
    document.querySelectorAll("[data-brand-name]").forEach((element) => { element.textContent = companyName; });
    document.querySelectorAll("[data-brand-mark]").forEach((mark) => {
        const logo = mark.querySelector("[data-brand-logo]");
        if (company.logo && logo) {
            logo.src = company.logo;
            logo.hidden = false;
            mark.querySelector("i")?.setAttribute("hidden", "");
        }
    });
    document.querySelectorAll("[data-company-phone]").forEach((link) => {
        const phone = fields.phone || "";
        const label = link.querySelector("[data-company-phone-text]");
        if (label) label.textContent = phone;
        else link.textContent = phone;
        link.href = phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : "#contact";
        link.hidden = !phone;
    });
    document.querySelectorAll("[data-company-email]").forEach((link) => {
        const email = fields.email || "";
        const label = link.querySelector("[data-company-email-text]");
        if (label) label.textContent = email;
        else link.textContent = email;
        link.href = email ? `mailto:${email}` : "#contact";
        link.hidden = !email;
    });
    document.querySelectorAll("[data-company-address]").forEach((element) => { element.textContent = fields.address || "Đang cập nhật địa chỉ"; });
    document.querySelectorAll("[data-company-address-wrap]").forEach((element) => { element.hidden = !fields.address; });

    const websiteUrl = fields.website
        ? (/^https?:\/\//i.test(fields.website) ? fields.website : `https://${fields.website}`)
        : "";
    document.querySelectorAll("[data-company-website]").forEach((link) => {
        const label = link.querySelector("[data-company-website-text]");
        if (label) label.textContent = (fields.website || "").replace(/^https?:\/\//i, "").replace(/\/$/, "");
        link.href = websiteUrl || "#contact";
        link.hidden = !websiteUrl;
    });

    const map = document.querySelector("[data-company-map]");
    if (fields.address && map) {
        const query = encodeURIComponent(fields.address);
        map.src = `https://www.google.com/maps?q=${query}&output=embed`;
        const mapLink = document.querySelector("[data-company-map-link]");
        if (mapLink) mapLink.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
    } else if (map?.closest(".customer-company-map")) {
        map.closest(".customer-company-map").hidden = true;
    }

    const storyTitle = document.querySelector("#aboutStoryTitle");
    const storyBody = document.querySelector("#aboutStoryBody");
    if (storyTitle && storyBody) {
        const defaults = window.CustomerAboutArticleDefaults || {};
        let article = { ...defaults };
        try {
            const savedArticle = JSON.parse(null || "null");
            if (savedArticle && typeof savedArticle === "object") article = { ...article, ...savedArticle };
        } catch { /* Keep the default introduction article. */ }

        storyTitle.textContent = article.title || defaults.title || "Giới thiệu doanh nghiệp";
        const intro = document.querySelector("#aboutStoryIntro");
        if (intro) intro.textContent = article.intro || "";
        const cover = document.querySelector("#aboutStoryCover");
        if (cover) {
            if (article.coverImage) cover.src = article.coverImage;
            cover.alt = article.coverAlt || "Ảnh minh họa bài viết";
        }
        const caption = document.querySelector("#aboutStoryCaption");
        if (caption) caption.textContent = article.caption || "";

        function copySafeRichNode(node) {
            if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.nodeValue || "");
            if (node.nodeType !== Node.ELEMENT_NODE) return null;
            const tag = node.tagName.toLowerCase();
            if (["script", "style", "iframe", "object", "embed", "form", "input", "button", "svg", "video", "audio"].includes(tag)) return null;
            const allowed = new Set(["p", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "strong", "b", "em", "i", "u", "s", "br", "a", "img", "figure", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "hr", "span"]);
            if (!allowed.has(tag)) {
                const fragment = document.createDocumentFragment();
                node.childNodes.forEach((child) => { const safeChild = copySafeRichNode(child); if (safeChild) fragment.append(safeChild); });
                return fragment;
            }
            const safe = document.createElement(tag);
            if (["p", "h2", "h3", "h4", "div", "span", "th", "td"].includes(tag)) {
                const align = node.style?.textAlign;
                if (["left", "right", "center", "justify"].includes(align)) safe.style.textAlign = align;
            }
            if (tag === "a") {
                const href = node.getAttribute("href") || "";
                try {
                    const url = new URL(href, window.location.href);
                    if (["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) {
                        safe.href = href;
                        if (url.protocol === "http:" || url.protocol === "https:") { safe.target = "_blank"; safe.rel = "noopener noreferrer"; }
                    }
                } catch { /* Drop malformed links and keep the link text. */ }
            }
            if (tag === "img") {
                const src = node.getAttribute("src") || "";
                try {
                    const url = new URL(src, window.location.href);
                    if (!["http:", "https:"].includes(url.protocol)) return null;
                    safe.src = url.href;
                    safe.alt = node.getAttribute("alt") || "";
                    safe.loading = "lazy";
                } catch { return null; }
            }
            node.childNodes.forEach((child) => { const safeChild = copySafeRichNode(child); if (safeChild) safe.append(safeChild); });
            return safe;
        }

        function appendInline(parent, value) {
            const pieces = String(value).split(/(\*\*[^*]+\*\*)/g);
            pieces.forEach((piece) => {
                if (piece.startsWith("**") && piece.endsWith("**")) {
                    const strong = document.createElement("strong");
                    strong.textContent = piece.slice(2, -2);
                    parent.append(strong);
                } else parent.append(document.createTextNode(piece));
            });
        }
        const rawBody = String(article.bodyHtml || article.body || "").trim();
        if (/<\/?(p|h[1-6]|ul|ol|li|blockquote|strong|b|em|i|a|img|table|div)\b/i.test(rawBody)) {
            const parsed = new DOMParser().parseFromString(rawBody, "text/html");
            storyBody.replaceChildren(...[...parsed.body.childNodes].map(copySafeRichNode).filter(Boolean));
        } else {
        const blocks = rawBody.split(/\n\s*\n/).filter(Boolean);
        storyBody.replaceChildren(...blocks.map((block, index) => {
            const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
            if (lines[0]?.startsWith("## ")) {
                const heading = document.createElement("h3");
                appendInline(heading, lines.join(" ").replace(/^##\s*/, ""));
                return heading;
            }
            if (lines[0]?.startsWith("> ")) {
                const quote = document.createElement("blockquote");
                appendInline(quote, lines.map((line) => line.replace(/^>\s*/, "")).join(" "));
                return quote;
            }
            if (lines.every((line) => line.startsWith("- "))) {
                const list = document.createElement("ul");
                lines.forEach((line) => {
                    const item = document.createElement("li");
                    appendInline(item, line.replace(/^-\s*/, ""));
                    list.append(item);
                });
                return list;
            }
            const paragraph = document.createElement("p");
            if (index === 0) paragraph.className = "about-blog-opening";
            appendInline(paragraph, lines.join(" "));
            return paragraph;
        }));
        }
    }

    const year = document.querySelector("#currentYear");
    if (year) year.textContent = String(new Date().getFullYear());

    const menuToggle = document.querySelector("#storeMenuToggle");
    const nav = document.querySelector(".store-nav");
    menuToggle?.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        menuToggle.setAttribute("aria-expanded", String(open));
        menuToggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
    });
    nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        menuToggle?.setAttribute("aria-expanded", "false");
        menuToggle?.setAttribute("aria-label", "Mở menu");
    }));

})();

