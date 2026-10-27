(() => {
    const inventory = window.LandiformInventory;
    if (!inventory) return;
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");
    const projects = {
        "AP-026": { area: "TP. Thủ Đức", type: "Căn hộ", image: "blue-residential-towers.jpg" },
        "GV-014": { area: "Biên Hòa", type: "Nhà phố", image: "residential-exterior.jpg" },
        "CP-008": { area: "Quận 7, TP. Hồ Chí Minh", type: "Căn hộ", image: "blue-residential-towers.jpg" },
        "LG-031": { area: "Long An", type: "Đất nền", image: "planned-neighborhood.jpg" },
    };
    try {
        const savedProjects = JSON.parse(null || "[]");
        if (Array.isArray(savedProjects)) savedProjects.forEach((project) => {
            if (project.code && project.name) projects[project.code] = { ...projects[project.code], name: project.name, area: project.area || projects[project.code]?.area || "Đang cập nhật", address: project.address || project.location || projects[project.code]?.address || "", type: project.type || projects[project.code]?.type || "Khác" };
        });
    } catch { /* Dùng danh sách dự án mẫu. */ }
    let company = { fields: { displayName: "An Phát Land", phone: "028 7300 6868", email: "contact@anphatland.vn", taxCode: "" }, logo: "" };
    try {
        const savedCompany = JSON.parse(null || "null");
        if (savedCompany?.fields) company = { ...company, ...savedCompany, fields: { ...company.fields, ...savedCompany.fields } };
    } catch { /* Dùng thông tin doanh nghiệp mẫu. */ }
    const companyName = company.fields.displayName || "Doanh nghiệp bất động sản";
    const tenantKey = String(company.fields.taxCode || companyName).toLocaleLowerCase("vi").replace(/[^\p{L}\p{N}]+/gu, "-");
    const favoritesKey = `landiform.customer.${tenantKey}.favorites.v1`;
    const product = inventory.all().find((item) => item?.id === productId && item.code && item.status !== "Chờ duyệt" && projects[item.projectCode]);
    const modal = document.querySelector("#appointmentModal");
    const form = document.querySelector("#appointmentRequestForm");
    const toast = document.querySelector("#detailToast");
    let toastTimer;
    let galleryImages = [];
    let activeImageIndex = 0;
    let viewerZoom = 1;
    let viewerPan = { x: 0, y: 0 };
    let panPointer = null;

    function notify(message) {
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3500);
    }
    function formatPrice(value) {
        const price = Number(value);
        return Number.isFinite(price) ? `${price.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ` : "Liên hệ";
    }
    function projectName(item) { return projects[item.projectCode]?.name || item.project || "Dự án"; }
    function productTitle(item) { return `${item.type || "Sản phẩm"} · ${item.code}`; }
    function propertyTypeIcon(type = "") {
        if (/đất|lô/i.test(type)) return "fa-map-location-dot";
        if (/nghỉ dưỡng|resort/i.test(type)) return "fa-umbrella-beach";
        if (/thương mại|văn phòng/i.test(type)) return "fa-briefcase";
        if (/đô thị/i.test(type)) return "fa-city";
        if (/nhà|biệt thự|villa/i.test(type)) return "fa-house";
        return "fa-building";
    }
    const propertyPhotos = {
        apartment: "https://images.unsplash.com/photo-1758193431351-68538bf55ec3?auto=format&fit=crop&w=1600&q=85",
        apartmentInterior: "https://images.unsplash.com/photo-1751945965597-71171ec7a458?auto=format&fit=crop&w=1600&q=85",
        house: "https://images.unsplash.com/photo-1769805446592-35a4ed882bc4?auto=format&fit=crop&w=1600&q=85",
        land: "https://images.unsplash.com/photo-1772325482422-55bc8dd65662?auto=format&fit=crop&w=1600&q=85",
        villa: "https://images.unsplash.com/photo-1774280960001-ce8169cfc38f?auto=format&fit=crop&w=1600&q=85",
        commercial: "https://images.unsplash.com/photo-1775577845258-5345de77e25d?auto=format&fit=crop&w=1600&q=85",
    };
    function imageFor(item) {
        const type = `${item.type || ""} ${projects[item.projectCode]?.type || ""}`.toLocaleLowerCase("vi");
        if (/đất|lô|khu đô thị/.test(type)) return propertyPhotos.land;
        if (/biệt thự|nghỉ dưỡng|resort|villa|condotel/.test(type)) return propertyPhotos.villa;
        if (/thương mại|văn phòng|shophouse|officetel|kho|nhà xưởng|commercial/.test(type)) return propertyPhotos.commercial;
        if (/nhà|townhouse|house/.test(type)) return propertyPhotos.house;
        if (/căn hộ|apartment/.test(type)) {
            const key = String(item.id || item.code || item.projectCode || "");
            const hash = [...key].reduce((sum, character) => sum + character.charCodeAt(0), 0);
            return hash % 2 ? propertyPhotos.apartmentInterior : propertyPhotos.apartment;
        }
        return propertyPhotos.apartment;
    }
    function galleryImagesFor(item) {
        const type = `${item.type || ""} ${projects[item.projectCode]?.type || ""}`.toLocaleLowerCase("vi");
        let images = [imageFor(item)];
        if (/đất|lô|khu đô thị/.test(type)) images = [...images, propertyPhotos.house, propertyPhotos.apartment];
        else if (/biệt thự|nghỉ dưỡng|resort|villa|condotel/.test(type)) images = [...images, propertyPhotos.apartmentInterior, propertyPhotos.house];
        else if (/thương mại|văn phòng|shophouse|officetel|kho|nhà xưởng|commercial/.test(type)) images = [...images, propertyPhotos.apartment, propertyPhotos.house];
        else if (/nhà|townhouse|house/.test(type)) images = [...images, propertyPhotos.villa, propertyPhotos.apartmentInterior];
        else images = [...images, propertyPhotos.apartmentInterior, propertyPhotos.commercial];
        return [...new Set(images)];
    }
    function renderGallery() {
        const image = document.querySelector("#detailPageImage");
        image.src = galleryImages[activeImageIndex];
        image.alt = `Ảnh minh họa ${activeImageIndex + 1} của ${productTitle(product)} tại ${projectName(product)}`;
        document.querySelector("#galleryCounter").textContent = `${activeImageIndex + 1} / ${galleryImages.length}`;
        const thumbnails = document.querySelector("#detailGalleryThumbnails");
        thumbnails.replaceChildren(...galleryImages.map((src, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `gallery-thumbnail${index === activeImageIndex ? " is-active" : ""}`;
            button.setAttribute("aria-label", `Xem ảnh ${index + 1}`);
            button.setAttribute("aria-pressed", String(index === activeImageIndex));
            const thumbnail = document.createElement("img");
            thumbnail.src = src;
            thumbnail.alt = "";
            thumbnail.loading = "lazy";
            button.append(thumbnail);
            button.addEventListener("click", () => { activeImageIndex = index; viewerZoom = 1; viewerPan = { x: 0, y: 0 }; renderGallery(); });
            return button;
        }));
        renderViewer();
    }
    function renderViewer(updateThumbnails = true, updateImage = true) {
        if (!product || !galleryImages.length) return;
        const image = document.querySelector("#viewerImage");
        if (updateImage) {
            image.src = galleryImages[activeImageIndex];
            image.alt = `Ảnh minh họa ${activeImageIndex + 1} của ${productTitle(product)} tại ${projectName(product)}`;
            document.querySelector("#viewerImageTitle").textContent = `${product.type} · ${product.code}`;
        }
        image.style.transform = `translate(${viewerPan.x}px, ${viewerPan.y}px) scale(${viewerZoom})`;
        document.querySelector("#viewerImageCounter").textContent = `${activeImageIndex + 1} / ${galleryImages.length}`;
        document.querySelector("#viewerZoomLevel").textContent = `${Math.round(viewerZoom * 100)}%`;
        document.querySelector("#viewerZoomOut").disabled = viewerZoom <= 1;
        document.querySelector("#viewerZoomIn").disabled = viewerZoom >= 3;
        if (updateThumbnails) {
            const thumbnails = document.querySelector("#viewerThumbnails");
            thumbnails.replaceChildren(...galleryImages.map((src, index) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = `gallery-thumbnail${index === activeImageIndex ? " is-active" : ""}`;
                button.setAttribute("aria-label", `Xem ảnh ${index + 1}`);
                button.setAttribute("aria-pressed", String(index === activeImageIndex));
                const thumbnail = document.createElement("img");
                thumbnail.src = src;
                thumbnail.alt = "";
                thumbnail.loading = "lazy";
                button.append(thumbnail);
                button.addEventListener("click", () => { activeImageIndex = index; viewerZoom = 1; viewerPan = { x: 0, y: 0 }; renderGallery(); });
                return button;
            }));
        }
    }
    function stepGallery(direction) {
        if (!galleryImages.length) return;
        activeImageIndex = (activeImageIndex + direction + galleryImages.length) % galleryImages.length;
        viewerZoom = 1;
        viewerPan = { x: 0, y: 0 };
        renderGallery();
    }
    function openImageViewer() {
        if (!product) return;
        viewerZoom = 1;
        viewerPan = { x: 0, y: 0 };
        document.querySelector("#imageViewer").hidden = false;
        document.body.classList.add("store-modal-open");
        renderViewer();
        document.querySelector("#closeImageViewer").focus();
    }
    function closeImageViewer() {
        document.querySelector("#imageViewer").hidden = true;
        if (modal.hidden) document.body.classList.remove("store-modal-open");
        document.querySelector("#openImageViewer").focus();
    }
    function readFavorites() {
        try {
            const value = JSON.parse(null || "[]");
            return Array.isArray(value) ? value : [];
        } catch { return []; }
    }
    function setBrand() {
        document.querySelectorAll("[data-brand-name]").forEach((element) => { element.textContent = companyName; });
        document.querySelectorAll("[data-brand-mark]").forEach((mark) => {
            const logo = mark.querySelector("[data-brand-logo]");
            if (company.logo && logo) { logo.src = company.logo; logo.hidden = false; mark.querySelector("i")?.setAttribute("hidden", ""); }
        });
        document.querySelectorAll("[data-company-phone]").forEach((link) => {
            const phone = company.fields.phone || "";
            link.href = phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : "#contact";
            const text = link.querySelector("[data-company-phone-text]");
            if (text) text.textContent = phone;
            else link.textContent = phone;
            link.hidden = !phone;
        });
        document.querySelectorAll("[data-company-email]").forEach((link) => {
            const email = company.fields.email || "";
            link.textContent = email;
            link.href = email ? `mailto:${email}` : "#contact";
            link.hidden = !email;
        });
    }
    function renderProduct() {
        setBrand();
        if (!product) {
            document.querySelector("#detailNotFound").hidden = false;
            document.title = `Không tìm thấy sản phẩm | ${companyName}`;
            return;
        }
        const project = projects[product.projectCode];
        const projectQuery = `?project=${encodeURIComponent(product.projectCode)}`;
        document.querySelector("#detailContent").hidden = false;
        galleryImages = galleryImagesFor(product);
        activeImageIndex = 0;
        viewerZoom = 1;
        viewerPan = { x: 0, y: 0 };
        renderGallery();
        const status = document.querySelector("#detailPageStatus");
        status.className = `product-status${product.status === "Đang giữ chỗ" ? " reserved" : product.status === "Chờ duyệt" ? " pending" : product.status === "Đã bán" ? " sold" : product.status === "Chưa mở bán" ? " soon" : ""}`;
        status.textContent = ({ "Còn bán": "Đang mở bán", "Đang giữ chỗ": "Đang giữ chỗ", "Chờ duyệt": "Đang có yêu cầu", "Đã bán": "Đã giao dịch", "Chưa mở bán": "Sắp mở bán" })[product.status] || product.status;
        document.querySelector("#detailPageProject").textContent = projectName(product);
        document.querySelector("#detailPageTitle").textContent = productTitle(product);
        const location = document.querySelector("#detailPageLocation");
        const locationIcon = document.createElement("i");
        locationIcon.className = "fa-solid fa-location-dot";
        locationIcon.setAttribute("aria-hidden", "true");
        const productAddress = product.address?.trim() || project.address?.trim() || project.area;
        location.replaceChildren(locationIcon, document.createTextNode(` ${productAddress}${product.tower ? ` · ${product.tower}${product.floor != null ? ` · Tầng ${product.floor}` : ""}` : ""}`));
        document.querySelector("#detailPagePrice").textContent = formatPrice(product.price);
        document.querySelector("#breadcrumbProduct").textContent = product.code;
        document.querySelector("#projectBreadcrumb").textContent = projectName(product);
        document.querySelector("#projectBreadcrumb").href = `index.html${projectQuery}#products`;
        document.querySelector("#projectNavLink").href = `index.html${projectQuery}#products`;
        document.querySelector("#viewProjectLink").href = `index.html${projectQuery}#products`;
        document.querySelector("#detailProjectDescription").textContent = `Tìm hiểu thêm các sản phẩm thuộc ${projectName(product)} tại ${project.area}. Đội ngũ ${companyName} có thể hỗ trợ thông tin về vị trí, tình trạng và chính sách bán hàng.`;
        const mapQuery = product.address?.trim() || project.address?.trim() || `${projectName(product)}, ${project.area}`;
        const encodedMapQuery = encodeURIComponent(mapQuery);
        document.querySelector("#detailMapAddress").textContent = product.address?.trim() || project.address?.trim() || project.area;
        document.querySelector("#detailProjectMap").src = `https://www.google.com/maps?q=${encodedMapQuery}&output=embed`;
        document.querySelector("#detailMapLink").href = `https://www.google.com/maps/search/?api=1&query=${encodedMapQuery}`;
        document.title = `${productTitle(product)} | ${projectName(product)} | ${companyName}`;
        const facts = [
            ["Mã sản phẩm", product.code, "fa-hashtag"], ["Loại hình", product.type || "Đang cập nhật", propertyTypeIcon(product.type)],
            ["Diện tích", product.area ? `${product.area} m²` : "Đang cập nhật", "fa-ruler-combined"],
            [product.floor != null ? "Tầng / tháp" : "Phân khu", product.floor != null ? `${product.tower || ""} · Tầng ${product.floor}` : product.tower || "Đang cập nhật", product.floor != null ? "fa-building" : "fa-map-location-dot"],
        ];
        const attributeIcons = { bedrooms: "fa-bed", bathrooms: "fa-bath", storeys: "fa-building", frontage: "fa-ruler-horizontal", depth: "fa-ruler-vertical", landUse: "fa-file-circle-check", usage: "fa-store" };
        const attributeLabels = { bedrooms: "Phòng ngủ", bathrooms: "Phòng tắm", storeys: "Số tầng xây dựng", frontage: "Mặt tiền (m)", depth: "Chiều sâu (m)", landUse: "Mục đích sử dụng / pháp lý", usage: "Mục đích sử dụng" };
        const attributes = { ...(product.attributes || {}) };
        const bedroomMatch = /(\d+)\s*phòng ngủ/i.exec(product.type || "");
        if (attributes.bedrooms == null && bedroomMatch) attributes.bedrooms = Number(bedroomMatch[1]);
        Object.entries(attributes).forEach(([key, value]) => {
            if (value !== "" && value != null && attributeLabels[key]) facts.push([attributeLabels[key], value, attributeIcons[key]]);
        });
        const factsContainer = document.querySelector("#detailPageFacts");
        factsContainer.replaceChildren(...facts.map(([label, value, icon]) => {
            const item = document.createElement("article");
            item.className = "detail-page-fact";
            item.innerHTML = `<span><i class="fa-solid ${icon}" aria-hidden="true"></i></span><div><small>${label}</small><strong></strong></div>`;
            item.querySelector("strong").textContent = value;
            return item;
        }));
        updateFavoriteButton();
    }
    function updateFavoriteButton() {
        if (!product) return;
        const saved = readFavorites().includes(product.id);
        const button = document.querySelector("#detailPageFavorite");
        button.classList.toggle("is-saved", saved);
        button.innerHTML = `<svg class="favorite-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg><span>${saved ? "Đã lưu sản phẩm" : "Lưu sản phẩm"}</span>`;
    }
    function openAppointment(mode = "viewing") {
        const isViewing = mode !== "consultation";
        form.elements.intent.value = isViewing ? "viewing" : "consultation";
        window.CustomerBranches?.setForArea(form.elements.branchId, projects[product.projectCode]?.area || "");
        document.querySelector("#appointmentModeLabel").textContent = isViewing ? "ĐẶT LỊCH XEM" : "TƯ VẤN SẢN PHẨM";
        document.querySelector("#appointmentTitle").textContent = isViewing ? "Đặt lịch xem sản phẩm" : "Nhờ chuyên viên tư vấn";
        document.querySelector("#appointmentIntro").textContent = isViewing
            ? "Chọn ngày và khung giờ mong muốn để chuyên viên xác nhận lịch xem."
            : "Để lại thông tin liên hệ. Chuyên viên sẽ gọi lại để giải đáp về sản phẩm, giá và chính sách.";
        const modeIcon = document.querySelector("#appointmentModeIcon");
        modeIcon.outerHTML = isViewing
            ? '<svg id="appointmentModeIcon" class="calendar-action-icon" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8.5 15l2 2 5-5"/></svg>'
            : '<i id="appointmentModeIcon" class="fa-solid fa-headset" aria-hidden="true"></i>';
        document.querySelector("#appointmentScheduleFields").hidden = !isViewing;
        form.elements.date.required = false;
        form.elements.dateDisplay.required = isViewing;
        form.elements.time.required = isViewing;
        document.querySelector("#appointmentSubmitButton").innerHTML = isViewing
            ? 'Xác nhận đặt lịch <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>'
            : 'Gửi yêu cầu tư vấn <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
        document.querySelector("#appointmentSelectedProduct").textContent = product ? `Sản phẩm quan tâm: ${product.code} · ${product.type} · ${projectName(product)}` : "";
        modal.hidden = false;
        document.body.classList.add("store-modal-open");
        form.elements.name.focus();
    }
    function closeAppointment() {
        modal.hidden = true;
        document.body.classList.remove("store-modal-open");
    }

    renderProduct();
    document.querySelector("#currentYear").textContent = String(new Date().getFullYear());
    document.querySelector("#detailPageFavorite").addEventListener("click", () => {
        if (!product) return;
        const favorites = readFavorites();
        const updated = favorites.includes(product.id) ? favorites.filter((id) => id !== product.id) : [...favorites, product.id];
        try { void 0; } catch { /* Tiếp tục hiển thị trạng thái trong trang. */ }
        updateFavoriteButton();
        notify(updated.includes(product.id) ? "Đã lưu sản phẩm vào danh sách quan tâm." : "Đã bỏ sản phẩm khỏi danh sách đã lưu.");
    });
    document.querySelector("#galleryPrevious").addEventListener("click", () => stepGallery(-1));
    document.querySelector("#galleryNext").addEventListener("click", () => stepGallery(1));
    document.querySelector("#viewerPrevious").addEventListener("click", () => stepGallery(-1));
    document.querySelector("#viewerNext").addEventListener("click", () => stepGallery(1));
    document.querySelector("#openImageViewer").addEventListener("click", openImageViewer);
    document.querySelector("#closeImageViewer").addEventListener("click", closeImageViewer);
    document.querySelector("#imageViewer").addEventListener("click", (event) => { if (event.target.id === "imageViewer") closeImageViewer(); });
    document.querySelector("#viewerZoomOut").addEventListener("click", () => { viewerZoom = Math.max(1, Number((viewerZoom - 0.25).toFixed(2))); if (viewerZoom === 1) viewerPan = { x: 0, y: 0 }; renderViewer(false, false); });
    document.querySelector("#viewerZoomIn").addEventListener("click", () => { viewerZoom = Math.min(3, Number((viewerZoom + 0.25).toFixed(2))); renderViewer(false, false); });
    document.querySelector("#imageViewerStage").addEventListener("wheel", (event) => {
        if (document.querySelector("#imageViewer").hidden) return;
        event.preventDefault();
        viewerZoom = event.deltaY < 0 ? Math.min(3, viewerZoom + 0.2) : Math.max(1, viewerZoom - 0.2);
        if (viewerZoom === 1) viewerPan = { x: 0, y: 0 };
        renderViewer(false, false);
    }, { passive: false });
    const viewerStage = document.querySelector("#imageViewerStage");
    viewerStage.addEventListener("pointerdown", (event) => {
        if (viewerZoom <= 1) return;
        panPointer = { id: event.pointerId, startX: event.clientX, startY: event.clientY, panX: viewerPan.x, panY: viewerPan.y };
        viewerStage.setPointerCapture(event.pointerId);
        viewerStage.classList.add("is-panning");
    });
    viewerStage.addEventListener("pointermove", (event) => {
        if (!panPointer || panPointer.id !== event.pointerId) return;
        viewerPan = { x: panPointer.panX + event.clientX - panPointer.startX, y: panPointer.panY + event.clientY - panPointer.startY };
        renderViewer(false, false);
    });
    const stopPanning = () => { panPointer = null; viewerStage.classList.remove("is-panning"); };
    viewerStage.addEventListener("pointerup", stopPanning);
    viewerStage.addEventListener("pointercancel", stopPanning);
    document.addEventListener("keydown", (event) => {
        if (document.querySelector("#imageViewer").hidden) return;
        if (event.key === "Escape") closeImageViewer();
        if (event.key === "ArrowLeft") stepGallery(-1);
        if (event.key === "ArrowRight") stepGallery(1);
        if (event.key === "+" || event.key === "=") { viewerZoom = Math.min(3, viewerZoom + 0.25); renderViewer(false, false); }
        if (event.key === "-") { viewerZoom = Math.max(1, viewerZoom - 0.25); if (viewerZoom === 1) viewerPan = { x: 0, y: 0 }; renderViewer(false, false); }
    });
    document.querySelectorAll("[data-open-appointment]").forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); openAppointment(button.dataset.openAppointment || "viewing"); }));
    const menuToggle = document.querySelector("#storeMenuToggle");
    menuToggle.addEventListener("click", () => {
        const nav = document.querySelector(".store-nav");
        const isOpen = nav.classList.toggle("is-open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Đóng menu" : "Mở menu");
    });
    document.querySelectorAll(".store-nav a").forEach((link) => link.addEventListener("click", () => {
        document.querySelector(".store-nav").classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Mở menu");
    }));
    document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeAppointment));
    modal.addEventListener("click", (event) => { if (event.target === modal) closeAppointment(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) closeAppointment(); });
    const now = new Date();
    form.elements.date.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const name = form.elements.name.value.trim();
        const intent = form.elements.intent.value;
        const branch = window.CustomerBranches?.get(form.elements.branchId.value);
        const nowLabel = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date());
        const lead = {
            id: `lead-${Date.now()}`,
            name,
            phone: form.elements.phone.value.trim(),
            email: form.elements.email.value.trim(),
            project: projectName(product),
            projectCode: product.projectCode,
            productId: product.id,
            branch: branch?.name || "",
            branchId: branch?.id || "",
            need: form.elements.message.value.trim() || `${intent === "viewing" ? "Đặt lịch xem" : "Tư vấn"} ${product.type} · ${product.code}`,
            ...(intent === "viewing" ? { appointment: { intent, date: form.elements.date.value, time: form.elements.time.value } } : {}),
            budget: "Chưa cập nhật",
            source: "Website · Chi tiết sản phẩm",
            owner: "Chưa phân công",
            status: "Chưa liên hệ",
            received: nowLabel,
            activities: [{ type: "Đăng ký", note: `Khách gửi yêu cầu ${intent === "viewing" ? "đặt lịch xem" : "tư vấn"}${branch ? ` tại ${branch.name}` : ""} cho ${product.code}.`, at: nowLabel }],
        };
        try {
            const saved = JSON.parse(null || "[]");
            const leads = Array.isArray(saved) ? saved : [];
            leads.push(lead);
            void 0;
        } catch { return notify("Chưa lưu được yêu cầu. Vui lòng thử lại hoặc liên hệ trực tiếp."); }
        form.reset();
        window.CustomerSelects?.syncAll();
        closeAppointment();
        notify(intent === "viewing"
            ? `Cảm ơn ${name}. Yêu cầu đặt lịch tại ${branch?.name || "chi nhánh phụ trách"} đã được ghi nhận.`
            : `Cảm ơn ${name}. Yêu cầu tư vấn tại ${branch?.name || "chi nhánh phụ trách"} đã được ghi nhận.`);
    });
})();

