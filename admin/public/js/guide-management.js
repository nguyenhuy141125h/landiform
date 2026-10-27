(() => {
    const categoryNames = {
        apartment: "Căn hộ", home: "Nhà ở", land: "Đất & lô đất",
        urban: "Khu đô thị", resort: "Nghỉ dưỡng", commercial: "Thương mại",
    };
    const list = document.querySelector("#guideList");
    const caption = document.querySelector("#guideListCaption");
    const form = document.querySelector("#guideForm");
    const empty = document.querySelector("#guideEditorEmpty");
    const editorTitle = document.querySelector("#guideEditorTitle");
    const imagePreview = document.querySelector("#guideImagePreview");
    const toast = document.querySelector("#toastMessage");
    if (!list || !form) return;

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

    function parseDefaults(html) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const tabs = new Map([...doc.querySelectorAll("[data-article-tab]")].map((tab) => [tab.dataset.articleTab, tab.querySelector("strong")?.textContent.trim() || ""]));
        return [...doc.querySelectorAll(".customer-article-page-grid [data-article-category]")].map((card, index) => ({
            id: card.dataset.articleId || `guide-${card.dataset.articleCategory}-${index + 1}`,
            category: card.dataset.articleCategory,
            kicker: card.querySelector(".customer-article-copy small")?.textContent.trim() || "CẨM NANG",
            title: card.querySelector(".customer-article-copy strong")?.textContent.trim() || "",
            summary: card.querySelector(".customer-article-copy span")?.textContent.trim() || "",
            image: card.querySelector(".article-feature-image")?.getAttribute("src") || "",
            imageAlt: card.querySelector(".article-feature-image")?.getAttribute("alt") || "",
            bodyHtml: card.querySelector(".customer-article-body")?.innerHTML || "",
            categoryName: tabs.get(card.dataset.articleCategory) || categoryNames[card.dataset.articleCategory] || "Cẩm nang",
            published: true,
        }));
    }

    async function loadGuides() {
        try {
            const saved = JSON.parse(null || "null");
            if (Array.isArray(saved)) return saved;
        } catch { /* Import the current Customer guide content below. */ }
        try {
            const response = await fetch("../../customer/articles.html", { cache: "no-store" });
            if (!response.ok) throw new Error("Không tải được bài viết Customer.");
            const seeded = parseDefaults(await response.text());
            void 0;
            return seeded;
        } catch {
            notify("Không tải được bài viết mẫu. Hãy mở trang Cẩm nang Customer một lần rồi tải lại.");
            return [];
        }
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

    function updateGuidesInMemory(next) {
        guides = next;
        return true;
    }

    function renderList() {
        caption.textContent = `${guides.length} bài viết · ${guides.filter((guide) => guide.published !== false).length} đang hiển thị trên Customer`;
        if (!guides.length) {
            const note = document.createElement("p");
            note.className = "guide-list-empty";
            note.textContent = "Chưa có bài viết. Hãy tạo bài đầu tiên.";
            list.replaceChildren(note);
            return;
        }
        list.replaceChildren(...guides.map((guide) => {
            const row = document.createElement("div");
            row.className = "guide-list-item-wrap";
            const open = document.createElement("button");
            open.type = "button";
            open.className = `guide-list-item${guide.id === activeId ? " is-active" : ""}`;
            open.dataset.guideId = guide.id;
            open.setAttribute("aria-label", `Mở bài viết ${guide.title || "chưa có tiêu đề"}`);
            const thumb = document.createElement("span");
            thumb.className = "guide-list-thumb";
            const src = imageUrl(guide.image);
            if (src) {
                const img = document.createElement("img");
                img.src = src;
                img.alt = "";
                img.loading = "lazy";
                thumb.append(img);
            } else thumb.innerHTML = '<i class="fa-regular fa-image" aria-hidden="true"></i>';
            const copy = document.createElement("span");
            copy.className = "guide-list-copy";
            const title = document.createElement("strong");
            title.textContent = guide.title || "Bài viết chưa có tiêu đề";
            const meta = document.createElement("small");
            meta.textContent = categoryNames[guide.category] || "Cẩm nang";
            copy.append(title, meta);
            const status = document.createElement("span");
            status.className = `guide-status${guide.published === false ? " is-hidden" : ""}`;
            status.textContent = guide.published === false ? "Bản nháp" : "Đang hiển thị";
            open.append(thumb, copy, status);
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "button button-danger guide-list-delete";
            remove.dataset.guideDelete = guide.id;
            remove.setAttribute("aria-label", `Xóa bài viết ${guide.title || "chưa có tiêu đề"}`);
            remove.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i>';
            row.append(open, remove);
            return row;
        }));
    }

    function setBody(value) {
        const editor = window.tinymce?.get("guideBody");
        if (editor) editor.setContent(value || "<p></p>");
        else bodyInput.value = value || "";
    }

    function openGuide(id) {
        const guide = guides.find((item) => item.id === id);
        if (!guide) return;
        activeId = id;
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
        renderList();
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
        const id = `draft-${Date.now()}`;
        const guide = { id, category: "apartment", kicker: "CẨM NANG", title: "", summary: "", image: "", imageAlt: "", bodyHtml: "<p></p>", published: false };
        guides = [...guides, guide];
        openGuide(id);
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
        if (!guide || !window.confirm(`Xóa bài viết “${guide.title || "Bài viết mới"}”?`)) return;
        updateGuidesInMemory(guides.filter((item) => item.id !== id));
        if (activeId === id) {
            activeId = null;
            form.reset();
            form.hidden = true;
            empty.hidden = false;
            editorTitle.textContent = "Chọn bài viết để chỉnh sửa";
            setBody("");
        }
        renderList();
        notify("Đã xóa bài viết khỏi danh sách xem trước.");
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
            guides = guides.filter((guide) => guide.id !== activeId);
            activeId = null;
            form.reset();
            form.hidden = true;
            empty.hidden = false;
            editorTitle.textContent = "Chọn bài viết để chỉnh sửa";
            setBody("");
            renderList();
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
        const previousId = form.elements.id.value;
        const id = previousId.startsWith("draft-") ? `guide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : previousId;
        const bodyHtml = window.tinymce?.get("guideBody")?.getContent().trim() || bodyInput.value.trim();
        const bodyText = new DOMParser().parseFromString(bodyHtml, "text/html").body.textContent.trim();
        if (!bodyText) return notify("Vui lòng nhập nội dung bài viết.");
        if (!imageUrl(imageInput.value)) return notify("Vui lòng nhập liên kết ảnh hợp lệ.");
        const nextGuide = {
            id,
            category: form.elements.category.value,
            kicker: form.elements.kicker.value.trim(),
            title: form.elements.title.value.trim(),
            summary: form.elements.summary.value.trim(),
            image: imageInput.value.trim(),
            imageAlt: form.elements.imageAlt.value.trim(),
            bodyHtml,
            published: form.elements.published.checked,
        };
        const next = guides.filter((guide) => guide.id !== previousId);
        next.push(nextGuide);
        updateGuidesInMemory(next);
        activeId = id;
        form.elements.id.value = id;
        document.querySelector("#guideDelete").hidden = false;
        editorTitle.textContent = nextGuide.title;
        renderList();
        notify("Đã cập nhật bài viết trong danh sách xem trước.");
    });
    document.querySelector("#guideDelete")?.addEventListener("click", () => {
        const guide = guides.find((item) => item.id === activeId);
        if (!guide || !window.confirm(`Xóa bài viết “${guide.title || "Bài viết mới"}”?`)) return;
        updateGuidesInMemory(guides.filter((item) => item.id !== activeId));
        activeId = null;
        form.reset();
        form.hidden = true;
        empty.hidden = false;
        editorTitle.textContent = "Chọn bài viết để chỉnh sửa";
        setBody("");
        renderList();
        notify("Đã xóa bài viết khỏi danh sách xem trước.");
    });
    document.querySelector("#globalSearch")?.addEventListener("input", (event) => {
        const query = event.currentTarget.value.trim().toLocaleLowerCase("vi");
        list.querySelectorAll("[data-guide-id]").forEach((item) => { item.hidden = Boolean(query) && !item.textContent.toLocaleLowerCase("vi").includes(query); });
    });

    loadGuides().then((items) => {
        guides = items;
        renderList();
        if (guides[0]) openGuide(guides[0].id);
        initializeEditor();
    });
})();

