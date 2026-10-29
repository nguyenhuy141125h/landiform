(() => {
    const list = document.querySelector("#guideList");
    const caption = document.querySelector("#guideListCaption");
    const form = document.querySelector("#guideForm");
    const empty = document.querySelector("#guideEditorEmpty");
    const editorTitle = document.querySelector("#guideEditorTitle");
    const imagePreview = document.querySelector("#guideImagePreview");
    const toast = document.querySelector("#toastMessage");
    if (!list || !form) return;
    const categoryNames = Object.fromEntries([...form.elements.category.options].map((option) => [option.value, option.textContent.trim()]));

    let guides = [];
    let activeId = null;
    let toastTimer;
    const imageInput = form.elements.image;
    const imageFileInput = form.elements.imageFile;
    const imageFileName = document.querySelector("#guideImageFileName");
    const bodyInput = form.elements.bodyHtml;

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function loadGuides() {
        return [...list.querySelectorAll(".guide-list-item-wrap")].map((row) => {
            const button = row.querySelector("[data-guide-id]");
            return {
                id: button.dataset.guideId,
                category: row.dataset.guideCategory,
                kicker: row.dataset.guideKicker,
                title: button.querySelector(".guide-list-copy strong")?.textContent.trim() || "",
                summary: row.dataset.guideSummary,
                image: row.dataset.guideImage,
                imageAlt: row.dataset.guideImageAlt,
                bodyHtml: row.querySelector("template[data-guide-body]")?.innerHTML || "",
                published: !button.querySelector(".guide-status")?.classList.contains("is-hidden"),
            };
        });
    }

    function imageUrl(value) {
        const source = String(value || "").trim();
        if (!source) return "";
        if (/^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(source)) return source;
        try {
            const url = new URL(source, new URL("../../customer/articles.html", location.href));
            return ["http:", "https:"].includes(url.protocol) ? url.href : "";
        }
        catch { return ""; }
    }

    async function prepareImage(file) {
        if (!file?.type.startsWith("image/")) throw new Error("Vui lòng chọn tệp ảnh.");
        if (file.size > 12 * 1024 * 1024) throw new Error("Ảnh cần nhỏ hơn 12 MB.");
        if (!window.createImageBitmap) throw new Error("Trình duyệt này chưa hỗ trợ chọn ảnh. Hãy dùng liên kết ảnh hiện có.");
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close?.();
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        if (dataUrl.length > 1_800_000) throw new Error("Ảnh sau khi tối ưu vẫn quá lớn. Hãy chọn ảnh nhẹ hơn.");
        return dataUrl;
    }

    function setBody(value) {
        const editor = window.tinymce?.get("guideBody");
        if (editor) editor.setContent(value || "<p></p>");
        else bodyInput.value = value || "";
    }

    function openGuide(idOrGuide) {
        const guide = typeof idOrGuide === "object" ? idOrGuide : guides.find((item) => item.id === idOrGuide);
        if (!guide) return;
        activeId = guide.id;
        form.hidden = false;
        empty.hidden = true;
        editorTitle.textContent = guide.title || "Bài viết mới";
        form.elements.id.value = guide.id;
        form.elements.category.value = guide.category || "apartment";
        form.elements.kicker.value = guide.kicker || "CẨM NANG";
        form.elements.title.value = guide.title || "";
        form.elements.summary.value = guide.summary || "";
        imageInput.value = guide.image || "";
        imageFileInput.value = "";
        imageFileName.textContent = guide.image ? "Ảnh hiện tại sẽ được giữ nguyên nếu không chọn ảnh mới." : "Chưa chọn ảnh. Chọn ảnh từ thiết bị để làm ảnh bìa.";
        form.elements.imageAlt.value = guide.imageAlt || "";
        form.elements.published.checked = guide.published !== false;
        setBody(guide.bodyHtml || "");
        renderImagePreview();
        document.querySelector("#guideDelete").hidden = guide.id.startsWith("draft-");
        list.querySelectorAll("[data-guide-id]").forEach((item) => item.classList.toggle("is-active", item.dataset.guideId === guide.id));
    }

    function renderImagePreview() {
        const src = imageUrl(imageInput.value);
        if (!src) {
            imagePreview.replaceChildren(Object.assign(document.createElement("i"), { className: "fa-regular fa-image" }), Object.assign(document.createElement("span"), { textContent: "Xem trước ảnh bìa" }));
            return;
        }
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Xem trước ảnh bìa";
        img.addEventListener("error", () => {
            imagePreview.replaceChildren(Object.assign(document.createElement("i"), { className: "fa-solid fa-triangle-exclamation" }), Object.assign(document.createElement("span"), { textContent: "Không tải được ảnh này. Kiểm tra lại liên kết." }));
        }, { once: true });
        imagePreview.replaceChildren(img);
    }

    function newGuide() {
        activeId = `draft-${Date.now()}`;
        form.reset();
        form.hidden = false;
        empty.hidden = true;
        editorTitle.textContent = "Bài viết mới";
        form.elements.id.value = activeId;
        form.elements.published.checked = false;
        imageInput.value = "";
        imageFileInput.value = "";
        imageFileName.textContent = "Chưa chọn ảnh. Chọn ảnh từ thiết bị để làm ảnh bìa.";
        setBody("<p></p>");
        renderImagePreview();
        document.querySelector("#guideDelete").hidden = true;
        list.querySelectorAll("[data-guide-id]").forEach((item) => item.classList.remove("is-active"));
        form.elements.title.focus();
    }

    function initializeEditor() {
        if (!window.tinymce) return;
        window.tinymce.init({
            selector: "#guideBody",
            height: 420,
            menubar: false,
            plugins: "advlist autolink lists link image charmap preview anchor searchreplace wordcount visualblocks code fullscreen media table directionality emoticons",
            toolbar: "undo redo | styleselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat | code",
            toolbar_mode: "sliding",
            relative_urls: false,
            convert_urls: false,
            image_caption: true,
            content_style: "body { font-family: 'Be Vietnam Pro', Arial, sans-serif; font-size: 14px; line-height: 1.8; color: #435d70; } h2,h3 { color: #173c56; }",
            setup(editor) {
                editor.on("change keyup undo redo", () => editor.save());
                editor.on("init", () => {
                    const guide = guides.find((item) => item.id === activeId);
                    if (guide) editor.setContent(guide.bodyHtml || "<p></p>");
                });
            },
        }).catch(() => notify("Không tải được bộ soạn thảo. Bạn vẫn có thể nhập nội dung HTML vào ô bài viết."));
    }

    function deleteGuide(id) {
        const guide = guides.find((item) => item.id === id);
        if (!guide) return;
        document.dispatchEvent(new CustomEvent("landiform:backend-submit", {
            detail: { entity: "guide-delete", id: guide.id },
        }));
        notify("Thao t\u00e1c x\u00f3a ch\u01b0a th\u1ef1c hi\u1ec7n v\u00ec trang ch\u01b0a k\u1ebft n\u1ed1i backend.");
    }

    list.addEventListener("click", (event) => {
        const deleteButton = event.target.closest("[data-guide-delete]");
        if (deleteButton) {
            deleteGuide(deleteButton.dataset.guideDelete);
            return;
        }
        const item = event.target.closest("[data-guide-id]");
        if (!item) return;
        openGuide(item.dataset.guideId);
    });
    document.querySelector("#guideCreate")?.addEventListener("click", newGuide);
    document.querySelector("#guideReset")?.addEventListener("click", () => {
        if (activeId?.startsWith("draft-")) {
            activeId = null;
            form.reset();
            form.hidden = true;
            empty.hidden = false;
            editorTitle.textContent = "Chọn bài viết để chỉnh sửa";
            setBody("");
            return;
        }
        const guide = guides.find((item) => item.id === activeId);
        if (guide) openGuide(guide.id);
    });
    imageFileInput.addEventListener("change", async () => {
        const file = imageFileInput.files?.[0];
        if (!file) return;
        imageFileName.textContent = `Đang xử lý: ${file.name}`;
        try {
            imageInput.value = await prepareImage(file);
            imageFileName.textContent = `Đã chọn: ${file.name}`;
            renderImagePreview();
        } catch (error) {
            imageFileInput.value = "";
            imageFileName.textContent = "Chưa chọn ảnh mới.";
            notify(error.message || "Không thể đọc ảnh này.");
        }
    });
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const bodyHtml = window.tinymce?.get("guideBody")?.getContent().trim() || bodyInput.value.trim();
        const bodyText = new DOMParser().parseFromString(bodyHtml, "text/html").body.textContent.trim();
        if (!bodyText) return notify("Vui lòng nhập nội dung bài viết.");
        if (!imageUrl(imageInput.value)) return notify("Vui lòng nhập liên kết ảnh hợp lệ.");
        const values = new FormData(form);
        values.set("bodyHtml", bodyHtml);
        document.dispatchEvent(new CustomEvent("landiform:backend-submit", {
            detail: { entity: "guide", id: activeId, values },
        }));
        notify("Bài viết chưa được lưu vì trang chưa kết nối backend.");
    });
    document.querySelector("#guideDelete")?.addEventListener("click", () => deleteGuide(activeId));
    document.querySelector("#globalSearch")?.addEventListener("input", (event) => {
        const query = event.currentTarget.value.trim().toLocaleLowerCase("vi");
        list.querySelectorAll("[data-guide-id]").forEach((item) => { item.hidden = Boolean(query) && !item.textContent.toLocaleLowerCase("vi").includes(query); });
    });

    guides = loadGuides();
    if (guides[0]) openGuide(guides[0].id);
    initializeEditor();
})();

