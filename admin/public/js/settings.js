(() => {
    const fields = [...document.querySelectorAll("[data-setting]")];
    const articleBodySource = document.querySelector(".about-article-body-input");
    const aboutFields = [...document.querySelectorAll("[data-about-setting]")].filter((field) => field !== articleBodySource);
    const customerSiteFields = [...document.querySelectorAll("[data-customer-site-setting]")];
    const saveButton = document.querySelector('[data-action="save-settings"]');
    const logoField = document.querySelector("#companyLogo");
    const logoImage = document.querySelector("#companyLogoImage");
    const logoInitials = document.querySelector("#companyLogoInitials");
    const previewName = document.querySelector("#companyPreviewName");
    const removeLogoButton = document.querySelector("[data-logo-remove]");
    const toast = document.querySelector("#toastMessage");
    const branchEditorList = document.querySelector("#branchEditorList");
    const addBranchButton = document.querySelector("#addBranchButton");
    if (!fields.length || !saveButton || !logoField || !logoImage || !logoInitials) return;

    const storageKey = "landiform.admin.company.v1";
    const systemLogo = "../../website/assets/logo.png";
    const aboutArticleKey = "landiform.admin.about-article.v1";
    const customerSiteKey = "landiform.admin.customer-site.v1";
    const branchesKey = "landiform.admin.branches.v1";
    const aboutDefaults = window.CustomerAboutArticleDefaults || {};
    const customerSiteDefaults = {
        heroTitle: "Khám phá dự án cho ngôi nhà tương lai.",
        heroDescription: "Tìm hiểu các dự án và sản phẩm bất động sản do An Phát Land phát triển. Xem thông tin từng căn, nhà hoặc lô đất và đặt lịch trao đổi cùng chuyên viên.",
    };
    let branches = [];
    let logoData = "";
    let toastTimer;
    let articleEditor;

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function bodyToHtml(value) {
        const source = String(value || "");
        if (/<\/?(p|h[1-6]|ul|ol|li|blockquote|strong|b|em|i|a|img|table|div)\b/i.test(source)) return source;
        const wrapper = document.createElement("div");
        source.trim().split(/\n\s*\n/).filter(Boolean).forEach((block) => {
            const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
            if (lines[0]?.startsWith("## ")) {
                const heading = document.createElement("h3");
                appendInlineMarkdown(heading, lines.join(" ").replace(/^##\s*/, ""));
                wrapper.append(heading);
            } else if (lines.every((line) => line.startsWith("- "))) {
                const list = document.createElement("ul");
                lines.forEach((line) => { const item = document.createElement("li"); appendInlineMarkdown(item, line.replace(/^-\s*/, "")); list.append(item); });
                wrapper.append(list);
            } else if (lines[0]?.startsWith("> ")) {
                const quote = document.createElement("blockquote");
                appendInlineMarkdown(quote, lines.map((line) => line.replace(/^>\s*/, "")).join(" "));
                wrapper.append(quote);
            } else {
                const paragraph = document.createElement("p");
                appendInlineMarkdown(paragraph, lines.join(" "));
                wrapper.append(paragraph);
            }
        });
        return wrapper.innerHTML || "<p></p>";
    }

    function initializeTinyMce() {
        if (!articleBodySource || !window.tinymce) return;
        window.tinymce.init({
            selector: "#aboutBody",
            height: 500,
            menubar: false,
            plugins: "advlist autolink lists link image charmap preview anchor searchreplace wordcount visualblocks code fullscreen media table directionality emoticons",
            toolbar: "undo redo | styleselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat | code",
            toolbar_mode: "sliding",
            relative_urls: false,
            convert_urls: false,
            image_caption: true,
            content_style: "body { font-family: 'Be Vietnam Pro', Arial, sans-serif; font-size: 14px; line-height: 1.8; color: #435d70; } h2,h3 { color: #173c56; }",
            setup(editor) {
                articleEditor = editor;
                editor.on("change keyup undo redo", () => editor.save());
            },
        }).catch(() => notify("Không tải được TinyMCE. Hãy kiểm tra kết nối mạng rồi tải lại trang."));
    }

    function appendInlineMarkdown(parent, value) {
        String(value).split(/(\*\*[^*]+\*\*)/g).forEach((piece) => {
            if (piece.startsWith("**") && piece.endsWith("**")) {
                const strong = document.createElement("strong");
                strong.textContent = piece.slice(2, -2);
                parent.append(strong);
            } else parent.append(document.createTextNode(piece));
        });
    }

    function initials(name) {
        return name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(-2)
            .map((word) => word[0]?.toUpperCase() || "")
            .join("") || "DN";
    }

    function updatePreview() {
        const displayName = document.querySelector('[name="displayName"]')?.value.trim() || "Doanh nghiệp";
        if (previewName) previewName.textContent = displayName;
        logoInitials.textContent = initials(displayName);
        logoImage.hidden = false;
        logoInitials.hidden = true;
        logoImage.src = logoData || systemLogo;
    }

    logoImage.addEventListener("error", () => {
        logoImage.hidden = true;
        logoInitials.hidden = false;
    });

    function defaultBranch() {
        return {
            id: "head-office",
            name: "Trụ sở chính",
            city: document.querySelector('[name="province"]')?.value || "TP. Hồ Chí Minh",
            address: "",
            phone: "",
            email: "",
            isDefault: true,
        };
    }

    function renderBranches() {
        if (!branchEditorList) return;
        branchEditorList.replaceChildren(...branches.map((branch, index) => {
            const card = document.createElement("article");
            card.className = "branch-editor-card";
            card.dataset.branchId = branch.id;
            const header = document.createElement("header");
            const identity = document.createElement("div");
            const kicker = document.createElement("small");
            kicker.textContent = `CHI NHÁNH ${String(index + 1).padStart(2, "0")}`;
            const title = document.createElement("strong");
            title.textContent = branch.name || `Chi nhánh ${index + 1}`;
            identity.append(kicker, title);
            const actions = document.createElement("div");
            actions.className = "branch-editor-actions";
            const defaultLabel = document.createElement("label");
            defaultLabel.className = "branch-default-choice";
            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "defaultBranchId";
            radio.value = branch.id;
            radio.checked = Boolean(branch.isDefault) || (!branches.some((item) => item.isDefault) && index === 0);
            const defaultText = document.createElement("span");
            defaultText.textContent = "Mặc định";
            defaultLabel.append(radio, defaultText);
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "button button-quiet branch-remove-button";
            remove.dataset.removeBranch = branch.id;
            remove.disabled = branches.length <= 1;
            remove.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i> Xóa';
            actions.append(defaultLabel, remove);
            header.append(identity, actions);

            const grid = document.createElement("div");
            grid.className = "branch-editor-fields";
            const makeField = (key, labelText, value, required = true, type = "text") => {
                const label = document.createElement("label");
                label.textContent = labelText;
                const input = document.createElement("input");
                input.type = type;
                input.value = value || "";
                input.dataset.branchField = key;
                input.required = required;
                if (key === "phone") { input.autocomplete = "tel"; input.placeholder = "Để trống nếu dùng số chung"; }
                if (key === "email") { input.autocomplete = "email"; input.placeholder = "Để trống nếu dùng email chung"; }
                if (key === "city") input.placeholder = "Hà Nội, TP. Hồ Chí Minh...";
                if (key === "address") { input.placeholder = branch.isDefault ? "Để trống nếu dùng địa chỉ trụ sở chính" : "Số nhà, đường, phường/xã..."; input.className = "branch-address-input"; }
                input.addEventListener("input", () => input.setCustomValidity(""));
                label.append(input);
                return label;
            };
            grid.append(
                makeField("name", "Tên chi nhánh", branch.name),
                makeField("city", "Tỉnh / Thành phố", branch.city),
                makeField("address", "Địa chỉ", branch.address, !branch.isDefault),
                makeField("phone", "Số điện thoại riêng", branch.phone, false),
                makeField("email", "Email riêng", branch.email, false, "email"),
            );
            card.append(header, grid);
            return card;
        }));
    }

    function newBranch() {
        return { id: `branch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: "Chi nhánh mới", city: "", address: "", phone: "", email: "", isDefault: branches.length === 0 };
    }

    function collectBranches() {
        const cards = [...branchEditorList.querySelectorAll(".branch-editor-card")];
        const result = cards.map((card) => {
            const values = Object.fromEntries([...card.querySelectorAll("[data-branch-field]")].map((input) => [input.dataset.branchField, input.value.trim()]));
            return { id: card.dataset.branchId, ...values, isDefault: Boolean(card.querySelector('input[name="defaultBranchId"]')?.checked) };
        });
        return result;
    }

    try {
        const saved = JSON.parse(null || "null");
        if (saved?.fields && typeof saved.fields === "object") {
            fields.forEach((field) => {
                if (typeof saved.fields[field.name] === "string") field.value = saved.fields[field.name];
            });
        }
        if (typeof saved?.logo === "string") logoData = saved.logo;
    } catch {
        logoData = "";
    }
    try {
        const savedArticle = JSON.parse(null || "null") || {};
        const articleValues = {
            aboutTitle: savedArticle.title ?? aboutDefaults.title ?? "",
            aboutIntro: savedArticle.intro ?? aboutDefaults.intro ?? "",
            aboutCoverImage: savedArticle.coverImage ?? aboutDefaults.coverImage ?? "",
            aboutCoverAlt: savedArticle.coverAlt ?? aboutDefaults.coverAlt ?? "",
            aboutCoverCaption: savedArticle.caption ?? aboutDefaults.caption ?? "",
            aboutBody: bodyToHtml(savedArticle.bodyHtml ?? savedArticle.body ?? aboutDefaults.body ?? ""),
        };
        aboutFields.forEach((field) => { field.value = articleValues[field.name] || ""; });
        if (articleBodySource) articleBodySource.value = articleValues.aboutBody || "";
        initializeTinyMce();
    } catch { /* Use the built-in introduction article as the editor starting point. */ }
    try {
        const savedSite = JSON.parse(null || "null") || {};
        customerSiteFields.forEach((field) => {
            const key = field.name === "siteHeroTitle" ? "heroTitle" : "heroDescription";
            field.value = savedSite[key] ?? customerSiteDefaults[key] ?? "";
        });
    } catch { /* Use the default Customer homepage introduction. */ }
    try {
        const savedBranches = JSON.parse(null || "null");
        branches = Array.isArray(savedBranches) && savedBranches.length
            ? savedBranches.filter((branch) => branch && branch.id)
            : [defaultBranch()];
        if (!branches.length) branches = [defaultBranch()];
        if (!branches.some((branch) => branch.isDefault)) branches[0].isDefault = true;
    } catch { branches = [defaultBranch()]; }
    const companyDefaults = Object.fromEntries(fields.map((field) => [field.name, field.value.trim()]));
    branches.forEach((branch) => {
        if (!branch.isDefault) return;
        ["address", "phone", "email"].forEach((key) => {
            if (branch[key] && branch[key] === companyDefaults[key]) branch[key] = "";
        });
    });
    renderBranches();
    updatePreview();

    fields.forEach((field) => {
        field.addEventListener("input", () => {
            field.setCustomValidity("");
            if (field.name === "displayName") updatePreview();
        });
    });
    aboutFields.forEach((field) => field.addEventListener("input", () => field.setCustomValidity("")));
    customerSiteFields.forEach((field) => field.addEventListener("input", () => field.setCustomValidity("")));
    addBranchButton?.addEventListener("click", () => { branches = collectBranches(); branches.push(newBranch()); renderBranches(); branchEditorList.lastElementChild?.querySelector('[data-branch-field="name"]')?.focus(); });
    branchEditorList?.addEventListener("click", (event) => {
        const removeButton = event.target.closest("[data-remove-branch]");
        if (!removeButton || branches.length <= 1) return;
        branches = collectBranches().filter((branch) => branch.id !== removeButton.dataset.removeBranch);
        if (!branches.some((branch) => branch.isDefault)) branches[0].isDefault = true;
        renderBranches();
    });

    logoField.addEventListener("change", () => {
        const file = logoField.files?.[0];
        if (!file) return;
        if (file.size > 1024 * 1024) {
            logoField.value = "";
            notify("Logo cần có dung lượng nhỏ hơn 1 MB.");
            return;
        }
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            logoData = typeof reader.result === "string" ? reader.result : "";
            updatePreview();
        });
        reader.readAsDataURL(file);
    });

    removeLogoButton?.addEventListener("click", () => {
        logoData = "";
        logoField.value = "";
        updatePreview();
    });

    saveButton.addEventListener("click", () => {
        const invalidField = fields.find((field) => !field.checkValidity() || !field.value.trim());
        if (invalidField) {
            invalidField.setCustomValidity(invalidField.value.trim() ? invalidField.validationMessage : "Vui lòng điền thông tin này.");
            invalidField.reportValidity();
            invalidField.focus();
            return;
        }
        const invalidArticleField = aboutFields.find((field) => !field.checkValidity() || (field.required && !field.value.trim()));
        if (invalidArticleField) {
            invalidArticleField.setCustomValidity(invalidArticleField.validity.typeMismatch ? "Vui lòng nhập một liên kết ảnh hợp lệ." : "Vui lòng điền nội dung bài viết này.");
            invalidArticleField.reportValidity();
            invalidArticleField.focus();
            return;
        }
        const articleBody = articleEditor ? articleEditor.getContent().trim() : articleBodySource?.value.trim() || "";
        if (!articleBody) {
            articleEditor?.setAttribute("aria-invalid", "true");
            articleEditor?.focus();
            notify("Vui lòng nhập nội dung bài viết.");
            return;
        }
        const invalidSiteField = customerSiteFields.find((field) => !field.checkValidity() || (field.required && !field.value.trim()));
        if (invalidSiteField) {
            invalidSiteField.setCustomValidity("Vui lòng nhập nội dung trang chủ.");
            invalidSiteField.reportValidity();
            invalidSiteField.focus();
            return;
        }
        const branchCard = [...branchEditorList.querySelectorAll(".branch-editor-card")].find((card) => [...card.querySelectorAll("[data-branch-field]")].some((input) => !input.checkValidity() || (input.required && !input.value.trim())));
        if (branchCard) {
            const invalidBranchField = [...branchCard.querySelectorAll("[data-branch-field]")].find((input) => !input.checkValidity() || (input.required && !input.value.trim()));
            invalidBranchField?.reportValidity();
            invalidBranchField?.focus();
            return;
        }
        const taxCode = document.querySelector('[name="taxCode"]');
        if (taxCode && !/^\d{10}(\d{3})?$/.test(taxCode.value.trim())) {
            taxCode.setCustomValidity("Mã số thuế gồm 10 hoặc 13 chữ số.");
            taxCode.reportValidity();
            taxCode.focus();
            return;
        }
        const values = Object.fromEntries(fields.map((field) => [field.name, field.value.trim()]));
        const article = {
            title: document.querySelector('[name="aboutTitle"]').value.trim(),
            intro: document.querySelector('[name="aboutIntro"]').value.trim(),
            coverImage: document.querySelector('[name="aboutCoverImage"]').value.trim(),
            coverAlt: document.querySelector('[name="aboutCoverAlt"]').value.trim(),
            caption: document.querySelector('[name="aboutCoverCaption"]').value.trim(),
            body: articleBody,
            bodyHtml: articleBody,
        };
        const siteValues = {
            heroTitle: document.querySelector('[name="siteHeroTitle"]').value.trim(),
            heroDescription: document.querySelector('[name="siteHeroDescription"]').value.trim(),
        };
        const savedBranches = collectBranches();
        const defaultId = branchEditorList.querySelector('input[name="defaultBranchId"]:checked')?.value;
        savedBranches.forEach((branch) => {
            branch.isDefault = branch.id === defaultId;
            if (branch.isDefault) ["address", "phone", "email"].forEach((key) => { if (branch[key] === values[key]) branch[key] = ""; });
        });
        try {
            void 0;
            void 0;
            void 0;
            void 0;
            document.querySelector(".workspace-copy strong").textContent = values.displayName;
            window.refreshAdminCompanyBranding?.();
            branches = savedBranches;
            renderBranches();
            notify("Đã lưu hồ sơ, nội dung website và chi nhánh.");
        } catch {
            notify("Không thể lưu thay đổi trên trình duyệt này.");
        }
    });
})();

