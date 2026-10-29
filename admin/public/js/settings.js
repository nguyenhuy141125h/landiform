(() => {
    const fields = [...document.querySelectorAll("[data-setting]")];
    const articleBodySource = document.querySelector(".about-article-body-input");
    const aboutFields = [...document.querySelectorAll("[data-about-setting]")].filter((field) => field !== articleBodySource);
    const customerSiteFields = [...document.querySelectorAll("[data-customer-site-setting]")];
    const saveButton = document.querySelector('[data-action="save-settings"]');
    const logoField = document.querySelector("#companyLogo");
    const aboutCoverFile = document.querySelector("#aboutCoverFile");
    const aboutCoverField = document.querySelector('[name="aboutCoverImage"]');
    const aboutCoverFileName = document.querySelector("#aboutCoverFileName");
    const aboutCoverPreview = document.querySelector("#aboutCoverPreview");
    const logoImage = document.querySelector("#companyLogoImage");
    const logoInitials = document.querySelector("#companyLogoInitials");
    const previewName = document.querySelector("#companyPreviewName");
    const removeLogoButton = document.querySelector("[data-logo-remove]");
    const toast = document.querySelector("#toastMessage");
    const branchEditorList = document.querySelector("#branchEditorList");
    const addBranchButton = document.querySelector("#addBranchButton");
    const branchTemplate = document.querySelector("#branchEditorTemplate");
    if (!fields.length || !saveButton || !logoField || !logoImage || !logoInitials) return;

    const systemLogo = "../../website/assets/logo.png";
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

    function collectBranches() {
        const cards = [...branchEditorList.querySelectorAll(".branch-editor-card")];
        const result = cards.map((card) => {
            const values = Object.fromEntries([...card.querySelectorAll("[data-branch-field]")].map((input) => [input.dataset.branchField, input.value.trim()]));
            return { id: card.dataset.branchId, ...values, isDefault: Boolean(card.querySelector('input[name="defaultBranchId"]')?.checked) };
        });
        return result;
    }

    initializeTinyMce();
    updatePreview();

    function renderAboutCoverPreview() {
        if (!aboutCoverPreview) return;
        const src = aboutCoverField?.value.trim();
        if (!src) {
            aboutCoverPreview.replaceChildren(
                Object.assign(document.createElement("i"), { className: "fa-regular fa-image", "aria-hidden": "true" }),
                Object.assign(document.createElement("span"), { textContent: "Xem trước ảnh bìa" }),
            );
            return;
        }
        const image = document.createElement("img");
        image.src = src;
        image.alt = document.querySelector('[name="aboutCoverAlt"]')?.value.trim() || "Ảnh bìa bài viết";
        image.addEventListener("error", () => {
            aboutCoverPreview.replaceChildren(
                Object.assign(document.createElement("i"), { className: "fa-solid fa-triangle-exclamation", "aria-hidden": "true" }),
                Object.assign(document.createElement("span"), { textContent: "Không thể hiển thị ảnh đã chọn." }),
            );
        }, { once: true });
        aboutCoverPreview.replaceChildren(image);
    }

    renderAboutCoverPreview();
    aboutCoverFile?.addEventListener("change", () => {
        const file = aboutCoverFile.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            aboutCoverFile.value = "";
            notify("Vui lòng chọn tệp hình ảnh.");
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            aboutCoverFile.value = "";
            notify("Ảnh bìa cần có dung lượng nhỏ hơn 8 MB.");
            return;
        }
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            aboutCoverField.value = typeof reader.result === "string" ? reader.result : "";
            aboutCoverFileName.textContent = `Đã chọn: ${file.name}`;
            renderAboutCoverPreview();
        });
        reader.addEventListener("error", () => notify("Không thể đọc tệp ảnh này."), { once: true });
        reader.readAsDataURL(file);
    });

    fields.forEach((field) => {
        field.addEventListener("input", () => {
            field.setCustomValidity("");
            if (field.name === "displayName") updatePreview();
        });
    });
    aboutFields.forEach((field) => field.addEventListener("input", () => field.setCustomValidity("")));
    customerSiteFields.forEach((field) => field.addEventListener("input", () => field.setCustomValidity("")));
    addBranchButton?.addEventListener("click", () => {
        if (!branchEditorList || !branchTemplate) return;
        const id = `branch-${Date.now()}`;
        const fragment = branchTemplate.content.cloneNode(true);
        const card = fragment.querySelector(".branch-editor-card");
        card.dataset.branchId = id;
        const radio = card.querySelector('input[name="defaultBranchId"]');
        radio.value = id;
        radio.checked = !branchEditorList.querySelector('input[name="defaultBranchId"]:checked');
        const remove = card.querySelector("[data-remove-branch]");
        remove.dataset.removeBranch = id;
        card.querySelector('[data-branch-field="address"]').placeholder = "Số nhà, đường, phường/xã...";
        branchEditorList.append(fragment);
        branchEditorList.querySelectorAll(".branch-remove-button").forEach((button) => { button.disabled = false; });
        branchEditorList.lastElementChild?.querySelector('[data-branch-field="name"]')?.focus();
    });
    branchEditorList?.addEventListener("click", (event) => {
        const removeButton = event.target.closest("[data-remove-branch]");
        if (!removeButton || branchEditorList.querySelectorAll(".branch-editor-card").length <= 1) return;
        const wasDefault = removeButton.closest(".branch-editor-card")?.querySelector('input[name="defaultBranchId"]')?.checked;
        removeButton.closest(".branch-editor-card")?.remove();
        const cards = [...branchEditorList.querySelectorAll(".branch-editor-card")];
        branchEditorList.querySelectorAll(".branch-remove-button").forEach((button) => { button.disabled = cards.length <= 1; });
        if (wasDefault) cards[0]?.querySelector('input[name="defaultBranchId"]')?.click();
    });
    branchEditorList?.addEventListener("change", (event) => {
        if (event.target.matches('input[name="defaultBranchId"]')) {
            const card = event.target.closest(".branch-editor-card");
            const address = card?.querySelector('[data-branch-field="address"]');
            if (address) {
                address.required = !event.target.checked;
                address.placeholder = event.target.checked ? "Để trống nếu dùng địa chỉ trụ sở chính" : "Số nhà, đường, phường/xã...";
            }
        }
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
        document.dispatchEvent(new CustomEvent("landiform:backend-submit", {
            detail: { entity: "company-settings", values, article, siteValues, branches: savedBranches, logo: logoData },
        }));
        notify("Th\u00f4ng tin ch\u01b0a \u0111\u01b0\u1ee3c l\u01b0u v\u00ec trang ch\u01b0a k\u1ebft n\u1ed1i backend.");
    });
})();

