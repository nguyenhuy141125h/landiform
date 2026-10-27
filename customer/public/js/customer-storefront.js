(() => {
    const inventory = window.LandiformInventory;
    const grid = document.querySelector("#productGrid");
    if (!inventory || !grid) return;
    const requestedProjectCode = new URLSearchParams(window.location.search).get("project") || "";
    const projects = {
        "AP-026": { name: "An Phú Riverside", area: "TP. Thủ Đức", type: "Căn hộ", image: "blue-residential-towers.jpg" },
        "GV-014": { name: "Green Valley", area: "Biên Hòa", type: "Nhà phố", image: "residential-exterior.jpg" },
        "CP-008": { name: "Central Park Towers", area: "Quận 7, TP. Hồ Chí Minh", type: "Căn hộ", image: "blue-residential-towers.jpg" },
        "LG-031": { name: "Lumière Garden", area: "Long An", type: "Đất nền", image: "planned-neighborhood.jpg" },
    };
    const formByProject = { "AP-026": "consult", "GV-014": "price", "CP-008": "viewing" };
    function campaignAttribution() {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get("utm_campaign") || "";
        const source = params.get("utm_source") || "";
        const campaignId = slug ? `campaign-${slug}` : "";
        const channels = { google: "Google Ads", meta: "Meta Ads", qr: "QR / Sự kiện", email: "Email", direct: "Truy cập trực tiếp" };
        return { campaignId, source: channels[source] ? `${channels[source]} · ${slug || "Website"}` : "Website · Đặt lịch" };
    }
    try {
        const saved = JSON.parse(null || "[]");
        if (Array.isArray(saved)) saved.forEach((project) => {
            const code = String(project.code || "").trim();
            const name = String(project.name || "").trim();
            if (/^[A-Z]{2,5}-[A-Z0-9]{2,}$/i.test(code) && name && !/^(admin|test|demo)$/i.test(name)) projects[code] = {
                ...projects[code],
                name,
                area: project.area || projects[project.code]?.area || "Đang cập nhật",
                type: project.type || projects[project.code]?.type || "Khác",
                address: project.address || project.location || projects[project.code]?.address || "",
            };
        });
    } catch { /* Dùng danh sách dự án mẫu có sẵn. */ }

    let company = { fields: { displayName: "An Phát Land", phone: "028 7300 6868", email: "contact@anphatland.vn", website: "https://anphatland.vn", address: "Tầng 12, 125 Nguyễn Huệ, Phường Sài Gòn, TP. Hồ Chí Minh" }, logo: "" };
    try {
        const saved = JSON.parse(null || "null");
        if (saved?.fields) company = { ...company, ...saved, fields: { ...company.fields, ...saved.fields } };
    } catch { /* Dùng thông tin doanh nghiệp mẫu. */ }
    const companyName = company.fields.displayName || "Doanh nghiệp bất động sản";
    const tenantFavoritesKey = `landiform.customer.${String(company.fields.taxCode || companyName).toLocaleLowerCase("vi").replace(/[^\p{L}\p{N}]+/gu, "-")}.favorites.v1`;
    const activeProjectCode = projects[requestedProjectCode] ? requestedProjectCode : "";
    const publicProducts = () => inventory.all().filter((item) => item && item.code && item.status !== "Chờ duyệt" && projects[item.projectCode] && (!activeProjectCode || item.projectCode === activeProjectCode));
    let products = publicProducts();
    let favorites = [];
    try {
        const saved = JSON.parse(null || "[]");
        if (Array.isArray(saved)) favorites = saved;
    } catch { favorites = []; }
    let favoritesOnly = new URLSearchParams(window.location.search).get("favorites") === "1";
    let selectedProduct = null;
    let toastTimer;
    const toast = document.querySelector("#storeToast");
    const productModal = document.querySelector("#productModal");
    const appointmentModal = document.querySelector("#appointmentModal");
    let qrRegistrationModal = null;
    const projectFilter = document.querySelector("#projectFilter");
    const areaFilter = document.querySelector("#areaFilter");
    const typeFilter = document.querySelector("#typeFilter");
    const availabilityFilter = document.querySelector("#availabilityFilter");
    const productSearch = document.querySelector("#productSearch");
    const advancedFilters = document.querySelector("#advancedFilters");
    const advancedFiltersToggle = document.querySelector("#toggleAdvancedFilters");
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
        if (!project) {
            try {
                const siteContent = JSON.parse(null || "null");
                if (siteContent?.heroTitle) title.textContent = siteContent.heroTitle;
                if (siteContent?.heroDescription) description.textContent = siteContent.heroDescription;
            } catch { /* Keep the default homepage introduction. */ }
        }
        const productHeading = document.querySelector("[data-product-heading]");
        if (project) {
            document.body.classList.add("project-site");
            const mapQuery = project.address || `${project.name}, ${project.area}`;
            const encodedMapQuery = encodeURIComponent(mapQuery);
            document.querySelector("#projectLocationSection").hidden = false;
            document.querySelector("#projectLocationTitle").textContent = project.name;
            document.querySelector("#projectLocationAddress").textContent = project.address || project.area;
            document.querySelector("#projectLocationMap").src = `https://www.google.com/maps?q=${encodedMapQuery}&output=embed`;
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
        const location = project?.area || "Đang cập nhật khu vực";
        const sector = product.tower ? `${product.tower}${product.floor != null ? ` · Tầng ${product.floor}` : ""}` : "";
        return sector ? `${location} · ${sector}` : location;
    }
    const propertyPhotos = {
        apartment: "https://images.unsplash.com/photo-1758193431351-68538bf55ec3?auto=format&fit=crop&w=1200&q=82",
        apartmentInterior: "https://images.unsplash.com/photo-1751945965597-71171ec7a458?auto=format&fit=crop&w=1200&q=82",
        house: "https://images.unsplash.com/photo-1769805446592-35a4ed882bc4?auto=format&fit=crop&w=1200&q=82",
        land: "https://images.unsplash.com/photo-1772325482422-55bc8dd65662?auto=format&fit=crop&w=1200&q=82",
        villa: "https://images.unsplash.com/photo-1774280960001-ce8169cfc38f?auto=format&fit=crop&w=1200&q=82",
        commercial: "https://images.unsplash.com/photo-1775577845258-5345de77e25d?auto=format&fit=crop&w=1200&q=82",
    };
    function imageFor(product) {
        const type = `${product.type || ""} ${projects[product.projectCode]?.type || ""}`.toLocaleLowerCase("vi");
        if (/đất|lô|khu đô thị/.test(type)) return propertyPhotos.land;
        if (/biệt thự|nghỉ dưỡng|resort|villa|condotel/.test(type)) return propertyPhotos.villa;
        if (/thương mại|văn phòng|shophouse|officetel|kho|nhà xưởng|commercial/.test(type)) return propertyPhotos.commercial;
        if (/nhà|townhouse|house/.test(type)) return propertyPhotos.house;
        if (/căn hộ|apartment/.test(type)) {
            const key = String(product.id || product.code || product.projectCode || "");
            const hash = [...key].reduce((sum, character) => sum + character.charCodeAt(0), 0);
            return hash % 2 ? propertyPhotos.apartmentInterior : propertyPhotos.apartment;
        }
        return propertyPhotos.apartment;
    }
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
        const chosen = projectFilter.value || activeProjectCode;
        const codes = Object.keys(projects).sort((a, b) => projects[a].name.localeCompare(projects[b].name, "vi"));
        [projectFilter, document.querySelector("#heroProject")].forEach((select) => {
            select.replaceChildren(new Option("Tất cả dự án", ""));
            codes.forEach((code) => select.add(new Option(projects[code].name, code)));
        });
        if (codes.includes(chosen)) projectFilter.value = chosen;
    }
    function syncAreaOptions() {
        const chosen = areaFilter.value;
        const areas = [...new Set(Object.values(projects).map((project) => String(project.area || "").trim()).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, "vi"));
        areaFilter.replaceChildren(new Option("Tất cả khu vực", ""));
        areas.forEach((area) => areaFilter.add(new Option(area, area)));
        if (areas.includes(chosen)) areaFilter.value = chosen;
    }
    function syncTypeOptions() {
        const selected = typeFilter.value;
        const types = [...new Set(products.map((item) => item.type).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
        [typeFilter, document.querySelector("#heroType")].forEach((select) => {
            select.replaceChildren(new Option("Tất cả loại hình", ""));
            types.forEach((type) => select.add(new Option(type, type)));
        });
        if (types.includes(selected)) typeFilter.value = selected;
    }
    function productAttributeFacts(product) {
        const attributes = { ...(product.attributes || {}) };
        const bedroomMatch = /(\d+)\s*phòng ngủ/i.exec(product.type || "");
        if (attributes.bedrooms == null && bedroomMatch) attributes.bedrooms = Number(bedroomMatch[1]);
        const labels = { bedrooms: "Phòng ngủ", bathrooms: "Phòng tắm", storeys: "Số tầng xây dựng", frontage: "Mặt tiền (m)", depth: "Chiều sâu (m)", landUse: "Pháp lý", usage: "Mục đích sử dụng" };
        return Object.entries(attributes).filter(([key, value]) => value !== "" && value != null && labels[key]).map(([key, value]) => [labels[key], value]);
    }
    function createCard(product) {
        const card = document.createElement("article");
        card.className = "product-card";
        card.dataset.productId = product.id;
        const imageWrap = document.createElement("div");
        imageWrap.className = "product-card-image";
        const image = document.createElement("img");
        image.src = imageFor(product);
        image.alt = `${productTitle(product)} tại ${projectName(product)}`;
        image.loading = "lazy";
        const status = document.createElement("span");
        status.className = `product-status ${statusClass(product.status)}`;
        status.textContent = statusText(product.status);
        const typeTag = document.createElement("span");
        typeTag.className = "product-type-tag";
        typeTag.textContent = product.type;
        const favorite = document.createElement("button");
        favorite.type = "button";
        favorite.className = `favorite-button${favorites.includes(product.id) ? " is-favorite" : ""}`;
        favorite.dataset.favorite = product.id;
        favorite.setAttribute("aria-label", favorites.includes(product.id) ? "Bỏ lưu sản phẩm" : "Lưu sản phẩm");
        const heart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        heart.setAttribute("class", "favorite-icon");
        heart.setAttribute("viewBox", "0 0 24 24");
        heart.setAttribute("aria-hidden", "true");
        heart.setAttribute("focusable", "false");
        const heartPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        heartPath.setAttribute("d", "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z");
        heart.append(heartPath);
        favorite.append(heart);
        imageWrap.append(image, status, typeTag, favorite);
        const body = document.createElement("div");
        body.className = "product-card-body";
        const project = document.createElement("p");
        project.className = "product-card-project";
        project.textContent = projectName(product);
        const titleRow = document.createElement("div");
        titleRow.className = "product-card-title-row";
        const title = document.createElement("h3");
        title.textContent = productTitle(product);
        const code = document.createElement("span");
        code.className = "product-code";
        code.textContent = product.code;
        titleRow.append(title, code);
        const location = document.createElement("p");
        location.className = "product-location";
        const pin = document.createElement("i");
        pin.className = "fa-solid fa-location-dot";
        pin.setAttribute("aria-hidden", "true");
        const locText = document.createElement("span");
        locText.textContent = locationName(product);
        location.append(pin, locText);
        const specs = document.createElement("div");
        specs.className = "product-specs";
        const areaSpec = document.createElement("span");
        areaSpec.innerHTML = '<i class="fa-solid fa-ruler-combined" aria-hidden="true"></i>';
        areaSpec.append(document.createTextNode(` ${product.area} m²`));
        const kindSpec = document.createElement("span");
        const kindIcon = document.createElement("i");
        kindIcon.className = `fa-solid ${propertyTypeIcon(product.type)}`;
        kindIcon.setAttribute("aria-hidden", "true");
        kindSpec.append(kindIcon, document.createTextNode(product.floor != null ? ` Tầng ${product.floor}` : ` ${product.tower || "Toàn khu"}`));
        specs.append(areaSpec, kindSpec);
        const bedrooms = product.attributes?.bedrooms ?? Number(/(\d+)\s*phòng ngủ/i.exec(product.type || "")?.[1] || 0);
        if (bedrooms) {
            const roomSpec = document.createElement("span");
            roomSpec.innerHTML = '<i class="fa-solid fa-bed" aria-hidden="true"></i>';
            roomSpec.append(document.createTextNode(` ${bedrooms} phòng ngủ`));
            specs.append(roomSpec);
        }
        const bottom = document.createElement("div");
        bottom.className = "product-card-bottom";
        const price = document.createElement("div");
        price.className = "product-price";
        const priceLabel = document.createElement("small");
        priceLabel.textContent = "GIÁ THAM KHẢO";
        const priceAmount = document.createElement("strong");
        priceAmount.textContent = formatPrice(product.price);
        price.append(priceLabel, priceAmount);
        const actions = document.createElement("div");
        actions.className = "product-actions";
        const detail = document.createElement("a");
        detail.className = "button button-secondary";
        detail.href = `detail.html?id=${encodeURIComponent(product.id)}&project=${encodeURIComponent(product.projectCode || "")}`;
        detail.textContent = "Chi tiết";
        const cardLink = document.createElement("a");
        cardLink.className = "product-card-main-link";
        cardLink.href = detail.href;
        cardLink.setAttribute("aria-label", `Xem chi tiết ${productTitle(product)} · ${product.code}`);
        const consult = document.createElement("button");
        consult.className = "button button-primary";
        consult.type = "button";
        consult.dataset.productAppointment = product.id;
        consult.innerHTML = '<svg class="calendar-action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8.5 15l2 2 5-5"/></svg> Tư vấn';
        actions.append(detail, consult);
        bottom.append(price, actions);
        body.append(project, titleRow, location, specs, bottom);
        card.append(imageWrap, body, cardLink);
        return card;
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
        grid.replaceChildren(...result.map(createCard));
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
        try { void 0; } catch { /* Yêu thích vẫn dùng được trong phiên hiện tại. */ }
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
        try {
            const saved = JSON.parse(null || "{}");
            if (saved?.[formId]) return saved[formId];
        } catch { /* Dùng cấu hình biểu mẫu mẫu bên dưới. */ }
        const samples = {
            consult: { id: "consult", name: "Đăng ký tư vấn", project: "An Phú Riverside", projectCode: "AP-026", email: true, need: true, budget: true, appointment: false, qr: false, status: "Đang nhận" },
            price: { id: "price", name: "Nhận bảng giá", project: "Green Valley", projectCode: "GV-014", email: true, need: true, budget: false, appointment: false, qr: false, status: "Đang nhận" },
            viewing: { id: "viewing", name: "Đăng ký tham quan", project: "Central Park Towers", projectCode: "CP-008", email: true, need: true, budget: true, appointment: true, qr: true, status: "Đang nhận" },
        };
        return samples[formId] || null;
    }
    function addPublicFormField(form, { name, label, type = "text", required = false, placeholder = "" }) {
        const wrapper = document.createElement("label");
        wrapper.textContent = label;
        const input = document.createElement(type === "textarea" ? "textarea" : "input");
        input.name = name;
        if (type !== "textarea") input.type = type;
        input.required = required;
        if (placeholder) input.placeholder = placeholder;
        if (type === "textarea") input.rows = 3;
        wrapper.append(input);
        form.append(wrapper);
        return input;
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
        if (!qrRegistrationModal) {
            qrRegistrationModal = document.createElement("div");
            qrRegistrationModal.className = "store-modal-backdrop";
            qrRegistrationModal.id = "qrRegistrationModal";
            qrRegistrationModal.hidden = true;
            qrRegistrationModal.innerHTML = '<section class="store-modal appointment-modal" role="dialog" aria-modal="true" aria-labelledby="qrRegistrationTitle"><button class="store-modal-close" type="button" data-qr-form-close aria-label="Đóng"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button><span class="appointment-modal-icon"><i class="fa-solid fa-clipboard-list" aria-hidden="true"></i></span><p class="store-eyebrow">BIỂU MẪU ĐĂNG KÝ</p><h2 id="qrRegistrationTitle"></h2><p class="appointment-modal-intro" id="qrRegistrationIntro"></p><div class="appointment-selected-product" id="qrRegistrationProject"></div><form class="appointment-request-form" id="qrRegistrationForm"></form></section>';
            document.body.append(qrRegistrationModal);
            qrRegistrationModal.addEventListener("click", (event) => {
                if (event.target === qrRegistrationModal || event.target.closest("[data-qr-form-close]")) closeQrRegistration();
            });
        }
        const modalForm = qrRegistrationModal.querySelector("#qrRegistrationForm");
        modalForm.replaceChildren();
        const name = addPublicFormField(modalForm, { name: "name", label: "Họ và tên", required: true, placeholder: "Nguyễn Văn A" });
        addPublicFormField(modalForm, { name: "phone", label: "Số điện thoại", type: "tel", required: true, placeholder: "09xx xxx xxx" });
        if (config.email) addPublicFormField(modalForm, { name: "email", label: "Email (không bắt buộc)", type: "email", placeholder: "ten@email.com" });
        if (config.need) addPublicFormField(modalForm, { name: "need", label: "Nhu cầu quan tâm", type: "textarea", placeholder: "Bạn đang quan tâm thông tin nào?" });
        if (config.budget) addPublicFormField(modalForm, { name: "budget", label: "Ngân sách dự kiến", placeholder: "Ví dụ: 3–4 tỷ" });
        if (config.appointment) {
            const row = document.createElement("div");
            row.className = "appointment-form-row";
            modalForm.append(row);
            const dateLabel = document.createElement("label");
            dateLabel.textContent = "Ngày muốn tham quan";
            const date = document.createElement("input");
            date.type = "date";
            date.name = "date";
            date.required = true;
            const today = new Date();
            date.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
            dateLabel.append(date);
            const timeLabel = document.createElement("label");
            timeLabel.textContent = "Khung giờ";
            const time = document.createElement("select");
            time.name = "time";
            time.required = true;
            time.add(new Option("Chọn khung giờ", ""));
            ["09:00 – 11:00", "13:30 – 15:00", "15:00 – 17:00"].forEach((slot) => time.add(new Option(slot, slot)));
            timeLabel.append(time);
            row.append(dateLabel, timeLabel);
        }
        const consent = document.createElement("label");
        consent.className = "appointment-consent";
        const consentInput = document.createElement("input");
        consentInput.type = "checkbox";
        consentInput.name = "consent";
        consentInput.required = true;
        const consentText = document.createElement("span");
        consentText.textContent = "Tôi đồng ý để chuyên viên liên hệ về yêu cầu này.";
        consent.append(consentInput, consentText);
        modalForm.append(consent);
        const actions = document.createElement("div");
        actions.className = "appointment-form-actions";
        actions.innerHTML = '<button class="button button-quiet" type="button" data-qr-form-close>Để sau</button><button class="button button-primary" type="submit">Gửi đăng ký <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>';
        modalForm.append(actions);
        qrRegistrationModal.querySelector("#qrRegistrationTitle").textContent = config.name;
        qrRegistrationModal.querySelector("#qrRegistrationIntro").textContent = "Để lại thông tin, đội ngũ tư vấn sẽ liên hệ với bạn.";
        qrRegistrationModal.querySelector("#qrRegistrationProject").textContent = `Dự án quan tâm: ${project?.name || config.project}`;
        qrRegistrationModal.hidden = false;
        document.body.classList.add("store-modal-open");
        name.focus();
        modalForm.onsubmit = (event) => {
            event.preventDefault();
            if (!modalForm.reportValidity()) return;
            const data = new FormData(modalForm);
            const received = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date());
            const params = new URLSearchParams(window.location.search);
            const appointment = config.appointment ? { intent: "viewing", date: String(data.get("date") || ""), time: String(data.get("time") || "") } : undefined;
            const lead = {
                id: `lead-${Date.now()}`, name: String(data.get("name") || "").trim(), phone: String(data.get("phone") || "").trim(),
                email: String(data.get("email") || "").trim(), project: project?.name || config.project, projectCode,
                formId: config.id, productId: "", campaignId: params.get("utm_campaign") ? `campaign-${params.get("utm_campaign")}` : "",
                need: String(data.get("need") || "").trim() || config.name, budget: String(data.get("budget") || "Chưa cập nhật"),
                source: "QR / Sự kiện", owner: "Chưa phân công", status: "Chưa liên hệ", received,
                ...(appointment ? { appointment } : {}),
                activities: [{ type: appointment ? "Đăng ký tham quan" : "Đăng ký", note: `Khách gửi biểu mẫu “${config.name}” qua mã QR.`, at: received }],
            };
            try {
                const saved = JSON.parse(null || "[]");
                const leads = Array.isArray(saved) ? saved : [];
                leads.push(lead);
                void 0;
            } catch { notify("Chưa ghi nhận được đăng ký. Vui lòng thử lại."); return; }
            modalForm.reset();
            closeQrRegistration();
            notify(`Cảm ơn ${lead.name}, thông tin đã được gửi đến đội ngũ tư vấn.`);
        };
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
    advancedFiltersToggle.addEventListener("click", () => {
        const isOpen = advancedFilters.hidden;
        advancedFilters.hidden = !isOpen;
        advancedFiltersToggle.setAttribute("aria-expanded", String(isOpen));
        advancedFiltersToggle.classList.toggle("is-open", isOpen);
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
    appointmentForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!appointmentForm.reportValidity()) return;
        if (appointmentDate.value < appointmentDate.min) return notify("Vui lòng chọn ngày từ hôm nay trở đi.");
        const name = appointmentForm.elements.name.value.trim();
        const selected = products.find((product) => product.id === appointmentForm.elements.productId.value);
          const projectCode = selected?.projectCode || activeProjectCode || "";
          const attribution = campaignAttribution();
        const branch = window.CustomerBranches?.get(appointmentForm.elements.branchId.value);
        const nowLabel = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date());
        const lead = {
            id: `lead-${Date.now()}`,
            name,
            phone: appointmentForm.elements.phone.value.trim(),
            email: appointmentForm.elements.email.value.trim(),
            project: selected ? projectName(selected) : "",
              projectCode,
              formId: new URLSearchParams(window.location.search).get("form") || formByProject[projectCode] || "",
            productId: selected?.id || "",
              campaignId: attribution.campaignId,
            branch: branch?.name || "",
            branchId: branch?.id || "",
            need: appointmentForm.elements.message.value.trim() || (selected ? `Đặt lịch xem ${selected.type} · ${selected.code}` : "Đặt lịch tư vấn chung"),
            appointment: { intent: "viewing", date: appointmentDate.value, time: appointmentForm.elements.time.value },
            budget: "Chưa cập nhật",
              source: attribution.source,
            owner: "Chưa phân công",
            status: "Chưa liên hệ",
            received: nowLabel,
            activities: [{ type: "Đăng ký", note: `Khách gửi yêu cầu đặt lịch${branch ? ` tại ${branch.name}` : ""}.`, at: nowLabel }],
        };
        try {
            const saved = JSON.parse(null || "[]");
            const leads = Array.isArray(saved) ? saved : [];
            leads.push(lead);
            void 0;
        } catch { return notify("Chưa lưu được yêu cầu. Vui lòng thử lại hoặc liên hệ trực tiếp."); }
        appointmentForm.reset();
        window.CustomerSelects?.syncAll();
        closeModal(appointmentModal);
        notify(`Cảm ơn ${name}. Yêu cầu đặt lịch${branch ? ` tại ${branch.name}` : ""} đã được ghi nhận.`);
    });

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

