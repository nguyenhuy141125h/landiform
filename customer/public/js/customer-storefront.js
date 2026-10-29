(() => {
    const inventory = window.LandiformInventory;
    const grid = document.querySelector("#productGrid");
    if (!inventory || !grid) return;
    const requestedProjectCode = new URLSearchParams(window.location.search).get("project") || "";
    const catalog = inventory.all();
    const projects = Object.fromEntries(catalog.reduce((map, product) => {
        if (product.projectCode && !map.has(product.projectCode)) map.set(product.projectCode, {
            name: product.project,
            area: product.projectArea || product.address || "Đang cập nhật",
            address: product.address || "",
            type: product.projectType || product.type,
        });
        return map;
    }, new Map()));
    const companyMarkup = document.querySelector("#customerCompanyProfile");
    const company = { fields: {
        displayName: companyMarkup?.dataset.name || "",
        phone: companyMarkup?.dataset.phone || "",
        email: companyMarkup?.dataset.email || "",
        website: companyMarkup?.dataset.website || "",
        address: companyMarkup?.dataset.address || "",
        taxCode: companyMarkup?.dataset.taxCode || "",
    }, logo: companyMarkup?.dataset.logo || "" };
    const companyName = company.fields.displayName || "Doanh nghiệp bất động sản";
    const activeProjectCode = projects[requestedProjectCode] ? requestedProjectCode : "";
    const publicProducts = () => catalog.filter((item) => item && item.code && item.status !== "Chờ duyệt" && projects[item.projectCode] && (!activeProjectCode || item.projectCode === activeProjectCode));
    let products = publicProducts();
    let favorites = [];
    let favoritesOnly = new URLSearchParams(window.location.search).get("favorites") === "1";
    let selectedProduct = null;
    let toastTimer;
    const toast = document.querySelector("#storeToast");
    const productModal = document.querySelector("#productModal");
    const appointmentModal = document.querySelector("#appointmentModal");
    const qrRegistrationModal = document.querySelector("#qrRegistrationModal");
    qrRegistrationModal?.addEventListener("click", (event) => {
        if (event.target === qrRegistrationModal || event.target.closest("[data-qr-form-close]")) closeQrRegistration();
    });
    const projectFilter = document.querySelector("#projectFilter");
    const areaFilter = document.querySelector("#areaFilter");
    const typeFilter = document.querySelector("#typeFilter");
    const availabilityFilter = document.querySelector("#availabilityFilter");
    const productSearch = document.querySelector("#productSearch");
    const advancedFiltersToggle = document.querySelector(".filter-advanced-toggle");
    const filterCount = document.querySelector("#filterCount");

    function configureBrandAndPage() {
        document.querySelectorAll("[data-brand-name]").forEach((element) => { element.textContent = companyName; });
        document.querySelectorAll("[data-brand-mark]").forEach((mark) => {
            const logo = mark.querySelector("[data-brand-logo]");
            const icon = mark.querySelector("i");
            if (company.logo && logo) {
                logo.src = company.logo;
                logo.hidden = false;
                if (icon) icon.hidden = true;
            }
        });
        document.querySelectorAll("[data-company-phone]").forEach((element) => {
            const phone = company.fields.phone || "";
            const text = element.querySelector("[data-company-phone-text]");
            if (text) text.textContent = phone;
            else element.textContent = phone;
            element.href = phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : "#contact";
            element.hidden = !phone;
        });
        document.querySelectorAll("[data-company-email]").forEach((element) => {
            const email = company.fields.email || "";
            const text = element.querySelector("[data-company-email-text]");
            if (text) text.textContent = email;
            else element.textContent = email;
            element.href = email ? `mailto:${email}` : "#contact";
            element.hidden = !email;
        });
        const address = company.fields.address || "";
        document.querySelectorAll("[data-company-address]").forEach((element) => { element.textContent = address || "Đang cập nhật địa chỉ"; });
        document.querySelectorAll("[data-company-address-wrap]").forEach((element) => { element.hidden = !address; });
        const website = company.fields.website || "";
        const websiteUrl = website && /^https?:\/\//i.test(website) ? website : website ? `https://${website}` : "";
        document.querySelectorAll("[data-company-website]").forEach((element) => {
            const text = element.querySelector("[data-company-website-text]");
            if (text) text.textContent = website.replace(/^https?:\/\//i, "").replace(/\/$/, "");
            element.href = websiteUrl || "#contact";
            element.hidden = !website;
        });
        const companyMap = document.querySelector("[data-company-map]");
        const companyMapLink = document.querySelector("[data-company-map-link]");
        if (address && companyMap) {
            const mapQuery = encodeURIComponent(address);
            companyMap.src = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
            companyMapLink.href = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
        } else if (companyMap?.parentElement) {
            companyMap.parentElement.hidden = true;
        }
        const year = document.querySelector("#currentYear");
        if (year) year.textContent = String(new Date().getFullYear());

        const project = activeProjectCode ? projects[activeProjectCode] : null;
        const title = document.querySelector("[data-hero-title]");
        const description = document.querySelector("[data-hero-description]");
        const productHeading = document.querySelector("[data-product-heading]");
        if (project) {
            document.body.classList.add("project-site");
            const mapQuery = project.address || `${project.name}, ${project.area}`;
            const encodedMapQuery = encodeURIComponent(mapQuery);
            document.querySelector("#projectLocationSection").hidden = false;
            document.querySelector("#projectLocationTitle").textContent = project.name;
            document.querySelector("#projectLocationAddress").textContent = project.address || project.area;
            const projectMapUrl = new URL("https://www.google.com/maps");
            projectMapUrl.searchParams.set("hl", "vi");
            projectMapUrl.searchParams.set("q", mapQuery);
            projectMapUrl.searchParams.set("z", project.address ? "16" : "12");
            projectMapUrl.searchParams.set("output", "embed");
            document.querySelector("#projectLocationMap").src = projectMapUrl.href;
            document.querySelector("#projectLocationLink").href = `https://www.google.com/maps/search/?api=1&query=${encodedMapQuery}`;
            projectFilter.value = activeProjectCode;
            title.replaceChildren(`Khám phá ${project.name}`, document.createElement("br"));
            const tagline = document.createElement("em");
            tagline.textContent = "chọn nơi an cư phù hợp.";
            title.append(tagline);
            description.textContent = `Tìm hiểu thông tin dự án ${project.name} tại ${project.area}. Xem từng sản phẩm đang được giới thiệu và đặt lịch trao đổi cùng chuyên viên ${companyName}.`;
            productHeading.textContent = `Sản phẩm tại ${project.name}`;
            document.querySelector("#projectFilter").hidden = true;
            document.querySelector("#heroProject").closest("div").hidden = true;
            document.querySelector(".hero-kicker").lastChild.textContent = ` · ${project.name.toLocaleUpperCase("vi")}`;
            document.title = `${project.name} | ${companyName}`;
        } else {
            document.title = `Dự án & sản phẩm | ${companyName}`;
        }
        const descriptionMeta = document.querySelector('meta[name="description"]');
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (descriptionMeta) descriptionMeta.content = project
            ? `Thông tin dự án ${project.name} tại ${project.area}. Xem sản phẩm và đăng ký lịch tư vấn với ${companyName}.`
            : `Khám phá dự án, căn hộ, nhà phố và đất nền của ${companyName}. Xem thông tin sản phẩm và đăng ký lịch tư vấn.`;
        if (ogTitle) ogTitle.content = document.title;
        if (ogDescription) ogDescription.content = descriptionMeta?.content || "";
    }

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
    function projectName(product) { return projects[product.projectCode]?.name || product.project || "Dự án"; }
    function locationName(product) {
        const project = projects[product.projectCode];
        const location = product.address?.trim() || project?.address?.trim() || project?.area || "Đang cập nhật khu vực";
        const sector = product.tower ? `${product.tower}${product.floor != null ? ` · Tầng ${product.floor}` : ""}` : "";
        return sector ? `${location} · ${sector}` : location;
    }
    function imageFor(product) { return product.image || ""; }
    function statusText(status) {
        return ({ "Còn bán": "Đang mở bán", "Đang giữ chỗ": "Đang giữ chỗ", "Chờ duyệt": "Đang có yêu cầu", "Đã bán": "Đã giao dịch", "Chưa mở bán": "Sắp mở bán" })[status] || status;
    }
    function statusClass(status) {
        return ({ "Còn bán": "", "Đang giữ chỗ": "reserved", "Chờ duyệt": "pending", "Đã bán": "sold", "Chưa mở bán": "soon" })[status] || "";
    }
    function productTitle(product) {
        const type = product.type || "Sản phẩm";
        if (/căn hộ/i.test(type)) return `${type}`;
        if (/đất|lô/i.test(type)) return `${type}`;
        return type;
    }
    function propertyTypeIcon(type = "") {
        if (/đất|lô/i.test(type)) return "fa-map-location-dot";
        if (/nghỉ dưỡng|resort/i.test(type)) return "fa-umbrella-beach";
        if (/thương mại|văn phòng/i.test(type)) return "fa-briefcase";
        if (/đô thị/i.test(type)) return "fa-city";
        if (/nhà|biệt thự|villa/i.test(type)) return "fa-house";
        return "fa-building";
    }
    function syncProjectOptions() {
        if (activeProjectCode) projectFilter.value = activeProjectCode;
    }
    function syncAreaOptions() {}
    function syncTypeOptions() {}
    function productAttributeFacts(product) {
        const attributes = { ...(product.attributes || {}) };
        const bedroomMatch = /(\d+)\s*phòng ngủ/i.exec(product.type || "");
        if (attributes.bedrooms == null && bedroomMatch) attributes.bedrooms = Number(bedroomMatch[1]);
        const labels = { bedrooms: "Phòng ngủ", bathrooms: "Phòng tắm", storeys: "Số tầng xây dựng", frontage: "Mặt tiền (m)", depth: "Chiều sâu (m)", landUse: "Pháp lý", usage: "Mục đích sử dụng" };
        return Object.entries(attributes).filter(([key, value]) => value !== "" && value != null && labels[key]).map(([key, value]) => [labels[key], value]);
    }
    function filteredProducts() {
        const query = productSearch.value.trim().toLocaleLowerCase("vi");
        const project = projectFilter.value;
        const area = areaFilter.value;
        const type = typeFilter.value;
        const availability = availabilityFilter.value;
        const minPrice = Number(document.querySelector("#minPrice").value || 0);
        const maxPrice = Number(document.querySelector("#maxPrice").value || Infinity);
        const minArea = Number(document.querySelector("#minArea").value || 0);
        const maxArea = Number(document.querySelector("#maxArea").value || Infinity);
        const bedrooms = document.querySelector("#bedroomFilter").value;
        const result = products.filter((product) => {
            const searchable = `${product.code} ${product.type} ${productNameText(product)} ${projectName(product)} ${locationName(product)}`.toLocaleLowerCase("vi");
            const projectArea = projects[product.projectCode]?.area || "";
            const bedroomMatch = /(\d+)\s*phòng ngủ/i.exec(product.type || "");
            const bedroomCount = product.attributes?.bedrooms != null ? Number(product.attributes.bedrooms) : bedroomMatch ? Number(bedroomMatch[1]) : null;
            const matchesBedrooms = !bedrooms
                || (bedrooms === "studio" ? /studio/i.test(product.type || "") : bedrooms === "4" ? bedroomCount >= 4 : bedroomCount === Number(bedrooms));
            return (!query || searchable.includes(query))
                && (!project || product.projectCode === project)
                && (!area || projectArea === area)
                && (!type || product.type === type)
                && (availability === "all" || (availability === "available" ? product.status === "Còn bán" : product.status === availability))
                && Number(product.price) >= minPrice
                && Number(product.price) <= maxPrice
                && Number(product.area) >= minArea
                && Number(product.area) <= maxArea
                && matchesBedrooms
                && (!favoritesOnly || favorites.includes(product.id));
        });
        const sort = document.querySelector("#sortFilter").value;
        if (sort === "price-asc") result.sort((a,b) => Number(a.price) - Number(b.price));
        if (sort === "price-desc") result.sort((a,b) => Number(b.price) - Number(a.price));
        if (sort === "area-asc") result.sort((a,b) => Number(a.area) - Number(b.area));
        if (sort === "area-desc") result.sort((a,b) => Number(b.area) - Number(a.area));
        return result;
    }
    function productNameText(product) { return `${product.tower || ""} ${product.floor == null ? "" : `tầng ${product.floor}`} ${product.number || ""}`; }
    function renderProducts() {
        const result = filteredProducts();
        const byId = new Map([...grid.querySelectorAll(".product-card[data-product-id]")]
            .map((card) => [card.dataset.productId, card]));
        const visible = new Set(result.map((product) => product.id));
        byId.forEach((card, id) => {
            card.hidden = !visible.has(id);
            const favorite = card.querySelector("[data-favorite]");
            if (favorite) {
                favorite.classList.toggle("is-favorite", favorites.includes(id));
                favorite.setAttribute("aria-label", favorites.includes(id) ? "Bỏ lưu sản phẩm" : "Lưu sản phẩm");
            }
        });
        result.forEach((product) => {
            const card = byId.get(product.id);
            if (card) grid.append(card);
        });
        document.querySelector("#showFavorites span").textContent = favoritesOnly ? "Tất cả" : "Đã lưu";
        document.querySelector("#emptyProducts").hidden = result.length > 0;
        document.querySelector("#resultSummary").textContent = favoritesOnly
            ? `${result.length} sản phẩm bạn đã lưu`
            : `${result.length} sản phẩm phù hợp${projectFilter.value ? ` tại ${projectName({ projectCode: projectFilter.value })}` : " với lựa chọn của bạn"}`;
        document.querySelector("#favoriteCount").textContent = String(favorites.length);
        updateFilterCount();
        window.CustomerSelects?.syncAll();
    }
    function updateFilterCount() {
        const activeCount = [
            productSearch.value.trim(), areaFilter.value, typeFilter.value,
            projectFilter.value && projectFilter.value !== activeProjectCode ? projectFilter.value : "",
            availabilityFilter.value !== "available" ? availabilityFilter.value : "",
            document.querySelector("#minPrice").value, document.querySelector("#maxPrice").value,
            document.querySelector("#minArea").value, document.querySelector("#maxArea").value,
            document.querySelector("#bedroomFilter").value,
            document.querySelector("#sortFilter").value !== "featured" ? document.querySelector("#sortFilter").value : "",
        ].filter(Boolean).length;
        filterCount.textContent = String(activeCount);
        filterCount.hidden = activeCount === 0;
        advancedFiltersToggle.classList.toggle("has-active-filters", activeCount > 0);
    }
    function saveFavorites() {
        renderProducts();
    }
    function toggleFavorite(id) {
        favorites = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
        saveFavorites();
        if (selectedProduct?.id === id) updateDetailFavorite();
        notify(favorites.includes(id) ? "Đã lưu sản phẩm vào danh sách quan tâm." : "Đã bỏ sản phẩm khỏi danh sách đã lưu.");
    }
    function updateDetailFavorite() {
        if (!selectedProduct) return;
        const button = document.querySelector("#detailFavorite");
        const saved = favorites.includes(selectedProduct.id);
        button.classList.toggle("is-saved", saved);
        button.innerHTML = `<svg class="favorite-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg> ${saved ? "Đã lưu sản phẩm" : "Lưu sản phẩm"}`;
    }
    function openProduct(id) {
        selectedProduct = products.find((product) => product.id === id);
        if (!selectedProduct) return;
        const product = selectedProduct;
        const image = document.querySelector("#detailImage");
        image.src = imageFor(product);
        image.alt = `${productTitle(product)} ${product.code}`;
        const status = document.querySelector("#detailStatus");
        status.className = `product-status ${statusClass(product.status)}`;
        status.textContent = statusText(product.status);
        document.querySelector("#detailProject").textContent = projectName(product);
        document.querySelector("#detailTitle").textContent = `${productTitle(product)} · ${product.code}`;
        document.querySelector("#detailLocation").textContent = locationName(product);
        document.querySelector("#detailPrice").textContent = formatPrice(product.price);
        const facts = document.querySelector("#detailFacts");
        facts.replaceChildren();
        const details = [
            ["Mã sản phẩm", product.code], ["Loại hình", product.type], ["Diện tích", `${product.area} m²`],
            [product.floor != null ? "Vị trí" : "Phân khu", product.floor != null ? `${product.tower} · Tầng ${product.floor}` : product.tower || "Đang cập nhật"],
            ...productAttributeFacts(product),
            ["Tình trạng", statusText(product.status)], ["Dự án", projectName(product)],
        ];
        details.forEach(([label, value]) => {
            const item = document.createElement("div");
            item.className = "detail-fact";
            const name = document.createElement("span");
            name.textContent = label;
            const text = document.createElement("strong");
            text.textContent = value;
            item.append(name, text);
            facts.append(item);
        });
        updateDetailFavorite();
        productModal.hidden = false;
        document.body.classList.add("store-modal-open");
        productModal.querySelector("[data-close-modal]").focus();
    }
    function openAppointment(product = null) {
        selectedProduct = product || null;
        const form = document.querySelector("#appointmentRequestForm");
        form.elements.productId.value = product?.id || "";
        window.CustomerBranches?.setForArea(form.elements.branchId, product ? projects[product.projectCode]?.area || "" : "");
        const selectedBox = document.querySelector("#appointmentSelectedProduct");
        selectedBox.hidden = !product;
        selectedBox.textContent = product ? `Sản phẩm quan tâm: ${product.code} · ${productTitle(product)} · ${projectName(product)}` : "";
        document.querySelector("#appointmentModal").hidden = false;
        document.body.classList.add("store-modal-open");
        form.elements.name.focus();
    }
    function formConfiguration(formId) {
        const element = document.querySelector(`#publicFormExamples [data-id="${CSS.escape(formId)}"]`);
        if (!element) return null;
        const record = { ...element.dataset };
        ["email", "need", "budget", "appointment", "qr"].forEach((key) => { record[key] = record[key] === "true"; });
        return record;
    }
    function openQrRegistration(formId) {
        const config = formConfiguration(formId);
        if (!config || !config.qr || config.status !== "Đang nhận") {
            notify("Biểu mẫu QR không tồn tại hoặc đang tạm dừng. Vui lòng liên hệ đơn vị tư vấn.");
            return;
        }
        const projectCode = new URLSearchParams(window.location.search).get("project") || config.projectCode || "";
        const project = projects[projectCode];
        if (config.projectCode && projectCode !== config.projectCode) {
            notify("Mã QR này không thuộc dự án đang mở.");
            return;
        }
        if (!qrRegistrationModal) return;
        const modalForm = qrRegistrationModal.querySelector("#qrRegistrationForm");
        ["email", "need", "budget", "appointment"].forEach((field) => {
            const wrapper = modalForm.querySelector(`[data-qr-field="${field}"]`);
            const enabled = Boolean(config[field]);
            wrapper.hidden = !enabled;
            wrapper.querySelectorAll("input, textarea, select").forEach((input) => { input.disabled = !enabled; });
        });
        const date = modalForm.elements.date;
        const today = new Date();
        date.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        qrRegistrationModal.querySelector("#qrRegistrationTitle").textContent = config.name;
        qrRegistrationModal.querySelector("#qrRegistrationIntro").textContent = "Để lại thông tin, đội ngũ tư vấn sẽ liên hệ với bạn.";
        qrRegistrationModal.querySelector("#qrRegistrationProject").textContent = `Dự án quan tâm: ${project?.name || config.project}`;
        qrRegistrationModal.hidden = false;
        document.body.classList.add("store-modal-open");
        modalForm.elements.name.focus();


    }
    function closeQrRegistration() {
        if (!qrRegistrationModal) return;
        qrRegistrationModal.hidden = true;
        if (productModal.hidden && appointmentModal.hidden) document.body.classList.remove("store-modal-open");
    }
    function closeModal(modal) {
        modal.hidden = true;
        if (productModal.hidden && appointmentModal.hidden) document.body.classList.remove("store-modal-open");
    }

    configureBrandAndPage();
    document.querySelector("#activateProjectMap")?.addEventListener("click", (event) => {
        event.currentTarget.hidden = true;
        document.querySelector("#projectLocationMap")?.focus();
    });
    syncProjectOptions();
    syncAreaOptions();
    syncTypeOptions();
    if (favoritesOnly) availabilityFilter.value = "all";
    renderProducts();
    document.querySelector("#heroSearchForm").addEventListener("submit", (event) => {
        event.preventDefault();
        productSearch.value = document.querySelector("#heroKeyword").value;
        if (!activeProjectCode) projectFilter.value = document.querySelector("#heroProject").value;
        typeFilter.value = document.querySelector("#heroType").value;
        favoritesOnly = false;
        renderProducts();
        document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
    });
    [productSearch, projectFilter, areaFilter, typeFilter, availabilityFilter, document.querySelector("#minPrice"), document.querySelector("#maxPrice"), document.querySelector("#minArea"), document.querySelector("#maxArea"), document.querySelector("#bedroomFilter"), document.querySelector("#sortFilter")].forEach((control) => {
        control.addEventListener(control.tagName === "INPUT" ? "input" : "change", () => { favoritesOnly = false; renderProducts(); });
    });

    document.querySelector("#clearFilters").addEventListener("click", clearFilters);
    document.querySelector("#emptyReset").addEventListener("click", clearFilters);
    function clearFilters() {
        productSearch.value = "";
        document.querySelector("#heroKeyword").value = "";
        document.querySelector("#heroProject").value = "";
        document.querySelector("#heroType").value = "";
        projectFilter.value = activeProjectCode || "";
        areaFilter.value = "";
        typeFilter.value = "";
        availabilityFilter.value = "available";
        document.querySelector("#minPrice").value = "";
        document.querySelector("#maxPrice").value = "";
        document.querySelector("#minArea").value = "";
        document.querySelector("#maxArea").value = "";
        document.querySelector("#bedroomFilter").value = "";
        document.querySelector("#sortFilter").value = "featured";
        favoritesOnly = false;
        renderProducts();
    }
    document.querySelector("#showFavorites").addEventListener("click", (event) => {
        event.preventDefault();
        favoritesOnly = !favoritesOnly;
        if (favoritesOnly) availabilityFilter.value = "all";
        document.querySelector("#showFavorites span").textContent = favoritesOnly ? "Tất cả" : "Đã lưu";
        renderProducts();
        document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
        if (favoritesOnly && !favorites.length) notify("Bạn chưa lưu sản phẩm nào. Chọn biểu tượng trái tim trên sản phẩm để lưu.");
    });
    document.querySelectorAll("[data-layout]").forEach((button) => button.addEventListener("click", () => {
        document.querySelectorAll("[data-layout]").forEach((item) => item.classList.toggle("is-active", item === button));
        grid.classList.toggle("list-layout", button.dataset.layout === "list");
    }));
    grid.addEventListener("click", (event) => {
        const favorite = event.target.closest("[data-favorite]");
        if (favorite) { toggleFavorite(favorite.dataset.favorite); return; }
        const details = event.target.closest("[data-product-detail]");
        if (details) { openProduct(details.dataset.productDetail); return; }
        const appointment = event.target.closest("[data-product-appointment]");
        if (appointment) openAppointment(products.find((item) => item.id === appointment.dataset.productAppointment));
    });
    document.querySelector("#detailFavorite").addEventListener("click", () => { if (selectedProduct) toggleFavorite(selectedProduct.id); });
    document.querySelector("#detailAppointment").addEventListener("click", () => {
        const product = selectedProduct;
        closeModal(productModal);
        openAppointment(product);
    });
    document.querySelectorAll("[data-open-appointment]").forEach((button) => button.addEventListener("click", (event) => { event.preventDefault(); openAppointment(); }));
    document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => {
        const modal = button.closest(".store-modal-backdrop");
        if (modal) closeModal(modal);
    }));
    [productModal, appointmentModal].forEach((modal) => modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(modal); }));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") [productModal, appointmentModal, qrRegistrationModal].filter(Boolean).forEach((modal) => { if (!modal.hidden) modal === qrRegistrationModal ? closeQrRegistration() : closeModal(modal); });
    });

    const appointmentForm = document.querySelector("#appointmentRequestForm");
    const appointmentDate = appointmentForm.elements.date;
    const now = new Date();
    appointmentDate.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;


    const menuToggle = document.querySelector("#storeMenuToggle");
    menuToggle.addEventListener("click", () => {
        const nav = document.querySelector(".store-nav");
        const isOpen = nav.classList.toggle("is-open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
    document.querySelectorAll(".store-nav a").forEach((link) => link.addEventListener("click", () => {
        document.querySelector(".store-nav").classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
    }));
    document.addEventListener("landiform:inventory-updated", () => {
        products = publicProducts();
        syncProjectOptions();
        syncAreaOptions();
        syncTypeOptions();
        renderProducts();
    });
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get("form")) openQrRegistration(queryParams.get("form"));
    else if (queryParams.get("appointment") === "1") openAppointment();
})();

