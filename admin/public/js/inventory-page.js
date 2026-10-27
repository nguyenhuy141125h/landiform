(() => {
    const inventory = window.LandiformInventory;
    const tbody = document.querySelector("#inventoryTableBody");
    const unitModal = document.querySelector("#unitModal");
    const bulkModal = document.querySelector("#unitBulkModal");
    const unitForm = document.querySelector("#unitForm");
    const unitGroup = document.querySelector("#unitGroup");
    const unitAttributeFields = document.querySelector("#unitAttributeFields");
    const bulkForm = document.querySelector("#unitBulkForm");
    if (!inventory || !tbody || !unitModal || !bulkModal || !unitForm || !bulkForm) return;

    const search = document.querySelector("#inventorySearch");
    const projectFilter = document.querySelector("#inventoryProjectFilter");
    const groupFilter = document.querySelector("#inventoryGroupFilter");
    const typeFilter = document.querySelector("#inventoryTypeFilter");
    const towerFilter = document.querySelector("#inventoryTowerFilter");
    const floorFilter = document.querySelector("#inventoryFloorFilter");
    const statusFilter = document.querySelector("#inventoryStatusFilter");
    const previous = document.querySelector("#inventoryPrevious");
    const next = document.querySelector("#inventoryNext");
    const toast = document.querySelector("#toastMessage");
    const deleteButton = document.querySelector("#unitDelete");
    const mapNavigation = document.querySelector("#inventoryMapNavigation");
    const mapSummary = document.querySelector("#inventoryMapSummary");
    const mapTowers = document.querySelector("#inventoryMapTowers");
    const mapFloors = document.querySelector("#inventoryMapFloors");
    const mapUnits = document.querySelector("#inventoryMapUnits");
    const listDetails = document.querySelector("#inventoryListDetails");
    const bulkButton = document.querySelector("[data-unit-bulk]");
    const detailModal = document.querySelector("#unitDetailModal");
    const detailEdit = document.querySelector("#unitDetailEdit");
    const detailBook = document.querySelector("#unitDetailBook");
    const pageSize = 15;
    const projects = {
        "AP-026": { name: "An Phú Riverside", type: "Căn hộ" },
        "CP-008": { name: "Central Park Towers", type: "Căn hộ" },
        "GV-014": { name: "Green Valley", type: "Nhà phố" },
        "LG-031": { name: "Lumière Garden", type: "Đất nền" },
    };
    try {
        const stored = JSON.parse(null || "[]");
        if (Array.isArray(stored)) stored.forEach((project) => {
            if (project.code && project.name) projects[project.code] = { name: project.name, type: project.type };
        });
    } catch {
        // Dự án có sẵn trên trang vẫn được hiển thị.
    }

    let units = inventory.all();
    let page = 1;
    let editingId = null;
    let viewingId = null;
    let selectedTower = "";
    let selectedFloor = null;
    let toastTimer;

    function updateTypeOptions() {
        const selected = typeFilter.value;
        const catalog = window.LandiformCategories?.all() || [];
        const selectedGroup = groupFilter?.value || "";
        const scopedUnits = units.filter((unit) => !projectFilter.value || unit.projectCode === projectFilter.value);
        const usedTypes = new Set(scopedUnits.map((unit) => unit.type).filter(Boolean));
        const types = [...new Set([
            ...catalog.filter((item) => String(item.level || 2) !== "1" && (!selectedGroup || item.group === selectedGroup)).map((item) => item.name),
            ...[...usedTypes].filter((name) => !selectedGroup || (window.LandiformCategories?.groupForType(name) || "other") === selectedGroup),
        ])].sort((a, b) => a.localeCompare(b, "vi"));
        typeFilter.replaceChildren(new Option("Tất cả loại sản phẩm", ""));
        types.forEach((type) => typeFilter.add(new Option(type, type)));
        if (types.includes(selected)) typeFilter.value = selected;
        else typeFilter.value = "";
    }

    function isApartment(project) {
        return ["Căn hộ", "Tòa nhà căn hộ", "Chung cư", "Chung cư / căn hộ"].includes(project?.type);
    }

    function isLandProject(project) {
        return ["Đất nền", "Lô đất riêng lẻ", "Đất nền dự án"].includes(project?.type);
    }

    function isHouseProject(project) {
        return ["Nhà phố", "Nhà riêng lẻ", "Biệt thự"].includes(project?.type);
    }

    function productTypesFor(project) {
        if (window.LandiformCategories) return window.LandiformCategories.forProject(project);
        const apartments = ["Căn hộ studio", "Căn hộ 1 phòng ngủ", "Căn hộ 2 phòng ngủ", "Căn hộ 3 phòng ngủ", "Căn hộ 4 phòng ngủ", "Penthouse", "Duplex", "Shophouse"];
        const houses = ["Nhà phố", "Nhà phố liền kề", "Nhà phố thương mại", "Nhà riêng", "Biệt thự song lập", "Biệt thự đơn lập", "Shophouse"];
        const land = ["Đất nền", "Đất nền dự án", "Đất thổ cư"];
        const commercial = ["Shophouse", "Officetel", "Văn phòng", "Mặt bằng thương mại", "Kho / nhà xưởng"];
        if (isApartment(project)) return apartments;
        if (isHouseProject(project)) return houses;
        if (isLandProject(project)) return land;
        if (project?.type === "Thương mại / văn phòng") return commercial;
        return [...new Set([...apartments, ...houses, ...land, ...commercial, "Biệt thự nghỉ dưỡng", "Condotel"])];
    }

    const productGroupLabels = { apartment: "Căn hộ", house: "Nhà ở", land: "Đất nền / lô đất", commercial: "Thương mại / văn phòng", other: "Nghỉ dưỡng / loại khác" };
    const productAttributeDefinitions = {
        apartment: [
            ["bedrooms", "Số phòng ngủ", "number", "Ví dụ: 2"],
            ["bathrooms", "Số phòng tắm", "number", "Ví dụ: 2"],
        ],
        house: [
            ["bedrooms", "Số phòng ngủ", "number", "Ví dụ: 3"],
            ["bathrooms", "Số phòng tắm", "number", "Ví dụ: 2"],
            ["storeys", "Số tầng xây dựng", "number", "Ví dụ: 3"],
            ["frontage", "Mặt tiền (m)", "number", "Ví dụ: 5"],
        ],
        land: [
            ["frontage", "Mặt tiền (m)", "number", "Ví dụ: 5"],
            ["depth", "Chiều sâu (m)", "number", "Ví dụ: 20"],
            ["landUse", "Pháp lý / mục đích sử dụng", "text", "Ví dụ: Đất ở đô thị, sổ riêng"],
        ],
        commercial: [["usage", "Mục đích sử dụng", "text", "Ví dụ: Văn phòng, kinh doanh"]],
        other: [],
    };

    function updateUnitTypeOptions(group, preferredType = "") {
        const catalog = window.LandiformCategories?.all() || [];
        const types = catalog.filter((item) => String(item.level || 2) !== "1" && item.group === group).map((item) => item.name);
        if (preferredType && !types.includes(preferredType)) types.unshift(preferredType);
        unitForm.elements.type.replaceChildren(...types.map((type) => new Option(type, type)));
        unitForm.elements.type.value = preferredType && types.includes(preferredType) ? preferredType : types[0] || "";
    }

    function populateUnitGroupOptions(selected = "") {
        const catalog = window.LandiformCategories?.all() || [];
        const groups = Object.keys(productGroupLabels).filter((group) => catalog.some((item) => String(item.level || 2) !== "1" && item.group === group));
        unitGroup.replaceChildren(...groups.map((group) => new Option(productGroupLabels[group], group)));
        if (groups.includes(selected)) unitGroup.value = selected;
        else unitGroup.value = groups[0] || "";
        unitGroup.disabled = !groups.length;
    }

    function renderUnitAttributes(group, values = {}) {
        if (!unitAttributeFields) return;
        const definitions = productAttributeDefinitions[group] || [];
        unitAttributeFields.replaceChildren();
        unitAttributeFields.hidden = !definitions.length;
        if (!definitions.length) return;
        const heading = document.createElement("p");
        heading.className = "inventory-attribute-heading";
        heading.textContent = `Thông tin thêm · ${productGroupLabels[group] || "Sản phẩm"}`;
        const fields = document.createElement("div");
        fields.className = "project-form-row inventory-attribute-grid";
        definitions.forEach(([name, labelText, type, placeholder]) => {
            const field = document.createElement("div");
            const label = document.createElement("label");
            label.htmlFor = `unitAttribute-${name}`;
            label.textContent = labelText;
            const input = document.createElement("input");
            input.id = `unitAttribute-${name}`;
            input.name = `attribute_${name}`;
            input.type = type;
            if (type === "number") { input.min = "0"; input.step = "0.1"; }
            input.placeholder = placeholder;
            input.value = values[name] ?? "";
            field.append(label, input);
            fields.append(field);
        });
        unitAttributeFields.append(heading, fields);
    }

    function updateBulkTypeOptions(preferredType = bulkForm.elements.type.value) {
        const project = projects[bulkForm.elements.projectCode.value];
        const types = productTypesFor(project).filter((type) => (window.LandiformCategories?.groupForType(type) || "other") === "apartment");
        bulkForm.elements.type.replaceChildren(...types.map((type) => new Option(type, type)));
        bulkForm.elements.type.value = types.includes(preferredType) ? preferredType : types[0] || "";
    }

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3400);
    }

    function addProjectOptions(select, apartmentOnly = false) {
        Object.entries(projects).forEach(([code, project]) => {
            if (apartmentOnly && !isApartment(project)) return;
            select.add(new Option(project.name, code));
        });
    }

    addProjectOptions(projectFilter);
    addProjectOptions(unitForm.elements.projectCode);
    addProjectOptions(bulkForm.elements.projectCode, true);
    const requestedProject = new URLSearchParams(location.search).get("project");
    projectFilter.value = requestedProject && projects[requestedProject] ? requestedProject : "";
    listDetails.open = !isApartment(projects[projectFilter.value]);

    function replaceOptions(select, placeholder, values) {
        const selected = select.value;
        select.replaceChildren(new Option(placeholder, ""));
        values.forEach((value) => select.add(new Option(String(value), String(value))));
        if ([...select.options].some((option) => option.value === selected)) select.value = selected;
    }

    function updateLocationFilters() {
        const project = projectFilter.value;
        const towerNames = [...new Set(units.filter((unit) => !project || unit.projectCode === project).map((unit) => unit.tower))]
            .sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));
        replaceOptions(towerFilter, "Tất cả tòa / phân khu", towerNames);
        const floorNumbers = [...new Set(units.filter((unit) =>
            (!project || unit.projectCode === project) && (!towerFilter.value || unit.tower === towerFilter.value) && unit.floor != null
        ).map((unit) => unit.floor))].sort((a, b) => a - b);
        replaceOptions(floorFilter, "Tất cả tầng", floorNumbers);
    }

    function tone(status) {
        return ({ "Còn bán": "green", "Chờ duyệt": "amber", "Đang giữ chỗ": "reserved", "Đã bán": "neutral", "Chưa mở bán": "blue" })[status] || "neutral";
    }

    function formatPrice(value) {
        const price = Number(value);
        return Number.isFinite(price) ? `${price.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ` : "—";
    }

    function statusStyle(status) {
        if (status === "Còn bán") return "available";
        if (status === "Đã bán") return "sold";
        if (status === "Chưa mở bán") return "unreleased";
        return "pending";
    }

    function renderMap() {
        const project = projects[projectFilter.value];
        const projectSelected = Boolean(projectFilter.value);
        const projectUnits = units.filter((unit) => !projectSelected || unit.projectCode === projectFilter.value);
        const apartment = isApartment(project);
        document.querySelector("#inventoryMapTitle").textContent = !projectSelected
            ? "Kho sản phẩm các dự án"
            : apartment ? "Chọn tòa, tầng và căn hộ" : "Sản phẩm của dự án";
        document.querySelector("#inventoryMapIntro").textContent = !projectSelected
            ? "Danh mục hỗ trợ căn hộ, nhà, biệt thự và lô đất. Chọn dự án để xem hoặc thêm đúng loại sản phẩm."
            : apartment
            ? "Chọn tòa và tầng để xem từng căn còn bán, đang giữ chỗ hoặc đã bán."
            : "Danh sách sản phẩm thuộc dự án đang chọn. Lọc, thêm hoặc chỉnh sửa từng sản phẩm bên dưới.";
        const addLabel = !projectSelected ? " Thêm sản phẩm" : apartment ? " Thêm căn hộ" : isLandProject(project) ? " Thêm lô đất" : isHouseProject(project) ? " Thêm căn nhà" : " Thêm sản phẩm";
        document.querySelector("[data-unit-add]").lastChild.textContent = addLabel;
        mapNavigation.hidden = !projectSelected || !apartment;
        bulkButton.hidden = !projectSelected || !apartment;
        mapSummary.replaceChildren();
        for (const [label, count, className] of [
            ["Tổng sản phẩm", projectUnits.length, "total"],
            ["Còn bán", projectUnits.filter((unit) => unit.status === "Còn bán").length, "available"],
            ["Đang xử lý", projectUnits.filter((unit) => ["Chờ duyệt", "Đang giữ chỗ"].includes(unit.status)).length, "pending"],
            ["Đã bán", projectUnits.filter((unit) => unit.status === "Đã bán").length, "sold"],
        ]) {
            const item = document.createElement("div");
            item.className = `inventory-map-stat ${className}`;
            const number = document.createElement("strong");
            number.textContent = count.toLocaleString("vi-VN");
            const caption = document.createElement("span");
            caption.textContent = label;
            item.append(number, caption);
            mapSummary.append(item);
        }
        if (!projectSelected || !apartment) return;

        const towers = [...new Set(projectUnits.map((unit) => unit.tower))].sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));
        if (!towers.includes(selectedTower)) {
            selectedTower = towers.reduce((best, tower) =>
                projectUnits.filter((unit) => unit.tower === tower).length > projectUnits.filter((unit) => unit.tower === best).length ? tower : best, towers[0] || "");
            selectedFloor = null;
        }
        document.querySelector("#inventoryTowerCount").textContent = `${towers.length} tòa`;
        mapTowers.replaceChildren();
        for (const tower of towers) {
            const towerUnits = projectUnits.filter((unit) => unit.tower === tower);
            const button = document.createElement("button");
            button.type = "button";
            button.className = "inventory-tower-button";
            button.dataset.tower = tower;
            button.setAttribute("aria-pressed", String(tower === selectedTower));
            const title = document.createElement("strong");
            title.textContent = `Tòa ${tower}`;
            const count = document.createElement("span");
            count.textContent = `${towerUnits.length} căn · ${towerUnits.filter((unit) => unit.status === "Còn bán").length} còn bán`;
            button.append(title, count);
            mapTowers.append(button);
        }
        if (!towers.length) {
            const empty = document.createElement("p");
            empty.className = "inventory-map-empty";
            empty.textContent = "Dự án chưa có tòa nhà. Chọn “Thêm nhiều căn hộ” để lập danh sách căn đầu tiên.";
            mapTowers.append(empty);
        }

        const towerUnits = projectUnits.filter((unit) => unit.tower === selectedTower);
        const floors = [...new Set(towerUnits.filter((unit) => unit.floor != null).map((unit) => unit.floor))].sort((a, b) => a - b);
        if (!floors.includes(selectedFloor)) {
            selectedFloor = floors.reduce((best, floor) =>
                towerUnits.filter((unit) => unit.floor === floor).length > towerUnits.filter((unit) => unit.floor === best).length ? floor : best, floors[0] ?? null);
        }
        document.querySelector("#inventorySelectedTower").textContent = selectedTower ? `Tòa ${selectedTower} · ${floors.length} tầng` : "";
        mapFloors.replaceChildren();
        for (const floor of floors) {
            const floorUnits = towerUnits.filter((unit) => unit.floor === floor);
            const button = document.createElement("button");
            button.type = "button";
            button.className = "inventory-floor-button";
            button.dataset.floor = String(floor);
            button.setAttribute("aria-pressed", String(floor === selectedFloor));
            const title = document.createElement("strong");
            title.textContent = `Tầng ${floor}`;
            const count = document.createElement("span");
            count.textContent = `${floorUnits.length} căn`;
            button.append(title, count);
            mapFloors.append(button);
        }
        const visible = towerUnits.filter((unit) => unit.floor === selectedFloor)
            .sort((a, b) => String(a.number).localeCompare(String(b.number), "vi", { numeric: true }));
        document.querySelector("#inventoryMapCount").textContent = selectedFloor == null ? "" : `Tòa ${selectedTower} · Tầng ${selectedFloor} · ${visible.length} căn`;
        mapUnits.replaceChildren();
        for (const unit of visible) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `inventory-unit-card ${statusStyle(unit.status)}`;
            button.dataset.unitView = unit.id;
            button.setAttribute("aria-label", `${unit.code}, ${unit.type}, ${unit.status}`);
            const number = document.createElement("strong");
            number.textContent = `Căn ${unit.number}`;
            const detail = document.createElement("span");
            detail.textContent = `${unit.type.replace("Căn hộ ", "")} · ${unit.area} m²`;
            const bottom = document.createElement("span");
            bottom.className = "inventory-unit-card-bottom";
            const price = document.createElement("b");
            price.textContent = formatPrice(unit.price);
            const status = document.createElement("small");
            status.textContent = unit.status;
            bottom.append(price, status);
            button.append(number, detail, bottom);
            mapUnits.append(button);
        }
        if (!visible.length) {
            const empty = document.createElement("p");
            empty.className = "inventory-map-empty";
            empty.textContent = "Tầng này chưa có căn hộ. Bạn có thể thêm từng căn hoặc nhập nhiều căn cùng lúc.";
            mapUnits.append(empty);
        }
    }

    function makeRow(unit) {
        const row = document.createElement("tr");
        const code = document.createElement("td");
        const strong = document.createElement("strong");
        strong.textContent = unit.code;
        code.append(strong);
        row.append(code);
        const projectCell = document.createElement("td");
        const projectLink = document.createElement("a");
        projectLink.className = "screen-link";
        projectLink.href = `project-detail.html?code=${encodeURIComponent(unit.projectCode)}`;
        projectLink.textContent = projects[unit.projectCode]?.name || unit.project || "Dự án";
        projectCell.append(projectLink);
        row.append(projectCell);
        for (const value of [unit.tower, unit.floor != null ? `Tầng ${unit.floor}` : "—", unit.type, unitSpecification(unit), `${unit.area} m²`, formatPrice(unit.price), unit.commissionPercent != null ? `${unit.commissionPercent}%` : "Chưa thiết lập"]) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.append(cell);
        }
        const statusCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `screen-badge ${tone(unit.status)}`;
        badge.textContent = unit.status;
        statusCell.append(badge);
        row.append(statusCell);
        const actionCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "inventory-actions";
        if (unit.status === "Còn bán") {
            const book = document.createElement("button");
            book.className = "project-detail-button";
            book.type = "button";
            book.dataset.unitConsult = unit.id;
            book.textContent = "Lên lịch tư vấn";
            actions.append(book);
        }
        const action = document.createElement("a");
        action.className = "project-detail-button";
        action.href = `product-detail.html?id=${encodeURIComponent(unit.id)}`;
        action.innerHTML = 'Chỉnh sửa <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
        const remove = document.createElement("button");
        remove.className = "button button-danger screen-row-delete";
        remove.type = "button";
        remove.dataset.inventoryDelete = unit.id;
        remove.setAttribute("aria-label", `Xóa sản phẩm ${unit.code}`);
        remove.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Xóa</span>';
        actions.append(action, remove);
        actionCell.append(actions);
        row.append(actionCell);
        return row;
    }

    function unitSpecification(unit) {
        const group = window.LandiformCategories?.groupForType(unit.type) || "other";
        const attributes = unit.attributes || {};
        const facts = [];
        if (group === "apartment" || group === "house" || group === "other") {
            const bedroomCount = attributes.bedrooms ?? Number(/(\d+)\s*phòng ngủ/i.exec(unit.type || "")?.[1] || 0);
            if (bedroomCount) facts.push(`${bedroomCount} PN`);
            if (attributes.bathrooms != null && attributes.bathrooms !== "") facts.push(`${attributes.bathrooms} PT`);
        }
        if (group === "house" && attributes.storeys) facts.unshift(`${attributes.storeys} tầng`);
        if (group === "land") {
            if (attributes.frontage) facts.push(`MT ${attributes.frontage} m`);
            if (attributes.depth) facts.push(`sâu ${attributes.depth} m`);
        }
        if (group === "commercial" && attributes.usage) facts.push(attributes.usage);
        return facts.join(" · ") || "—";
    }

    function render() {
        updateLocationFilters();
        updateTypeOptions();
        renderMap();
        if (tbody.dataset.staticDemo === "true") {
            const query = search.value.trim().toLocaleLowerCase("vi");
            const currentIds = new Set([...tbody.querySelectorAll('a[href*="product-detail.html?id="]')]
                .map((link) => new URL(link.href, location.href).searchParams.get("id")));
            units.filter((unit) => !currentIds.has(unit.id)).forEach((unit) => tbody.append(makeRow(unit)));
            const rows = [...tbody.rows];
            rows.forEach((row) => {
                const actionCell = row.cells[10];
                const editLink = actionCell?.querySelector('a[href*="product-detail.html?id="]');
                if (!actionCell || !editLink || actionCell.querySelector("[data-inventory-delete]")) return;
                const id = new URL(editLink.href, location.href).searchParams.get("id");
                if (!id) return;
                const actions = document.createElement("div");
                actions.className = "screen-row-actions";
                editLink.innerHTML = 'Chỉnh sửa <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
                const remove = document.createElement("button");
                remove.className = "button button-danger screen-row-delete";
                remove.type = "button";
                remove.dataset.inventoryDelete = id;
                remove.setAttribute("aria-label", `Xóa sản phẩm ${row.cells[0]?.textContent.trim() || ""}`);
                remove.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Xóa</span>';
                actions.append(editLink, remove);
                actionCell.replaceChildren(actions);
            });
            const visible = rows.filter((row) => {
                const text = row.textContent.toLocaleLowerCase("vi");
                const matchesProject = !projectFilter.value || row.cells[1]?.textContent.trim() === projects[projectFilter.value]?.name;
                const matchesGroup = !groupFilter?.value || (window.LandiformCategories?.groupForType(row.cells[4]?.textContent.trim()) || "other") === groupFilter.value;
                const matchesType = !typeFilter.value || row.cells[4]?.textContent.trim() === typeFilter.value;
                const matchesTower = !towerFilter.value || row.cells[2]?.textContent.trim() === towerFilter.value;
                const matchesFloor = !floorFilter.value || row.cells[3]?.textContent.includes(floorFilter.value);
                const matchesStatus = !statusFilter.value || row.cells[9]?.textContent.trim() === statusFilter.value;
                return (!query || text.includes(query)) && matchesProject && matchesGroup && matchesType && matchesTower && matchesFloor && matchesStatus;
            });
            rows.forEach((row) => { row.hidden = !visible.includes(row); });
            document.querySelector("#inventoryCount").textContent = `${visible.length} sản phẩm trong danh sách hiện tại`;
            document.querySelector("#inventoryPage").textContent = "Phiên hiện tại";
            previous.disabled = true;
            next.disabled = true;
            return;
        }
        const query = search.value.trim().toLocaleLowerCase("vi");
        const filtered = units.filter((unit) => {
            const searchable = `${unit.code} ${projects[unit.projectCode]?.name || unit.project} ${unit.tower} ${unit.type} ${unit.floor ?? ""}`.toLocaleLowerCase("vi");
            return (!query || searchable.includes(query)) &&
                (!projectFilter.value || unit.projectCode === projectFilter.value) &&
                (!groupFilter?.value || (window.LandiformCategories?.groupForType(unit.type) || "other") === groupFilter.value) &&
                (!typeFilter.value || unit.type === typeFilter.value) &&
                (!towerFilter.value || unit.tower === towerFilter.value) &&
                (!floorFilter.value || String(unit.floor) === floorFilter.value) &&
                (!statusFilter.value || unit.status === statusFilter.value);
        });
        const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
        page = Math.min(page, pages);
        const from = (page - 1) * pageSize;
        const visible = filtered.slice(from, from + pageSize);
        tbody.replaceChildren(...visible.map(makeRow));
        if (!visible.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 11;
            cell.textContent = "Chưa có căn hoặc sản phẩm phù hợp với bộ lọc.";
            row.append(cell);
            tbody.append(row);
        }
        document.querySelector("#inventoryCount").textContent = filtered.length
            ? `Hiển thị ${from + 1}–${from + visible.length} / ${filtered.length} sản phẩm`
            : "0 sản phẩm";
        document.querySelector("#inventoryPage").textContent = `Trang ${page} / ${pages}`;
        previous.disabled = page <= 1;
        next.disabled = page >= pages;
    }

    function close(modal) {
        modal.hidden = true;
        if (unitModal.hidden && bulkModal.hidden && detailModal.hidden) document.body.classList.remove("modal-open");
        modal.querySelector("form")?.reset();
        unitForm.elements.number.setCustomValidity("");
        editingId = null;
    }

    function closeDetail() {
        detailModal.hidden = true;
        viewingId = null;
        if (unitModal.hidden && bulkModal.hidden) document.body.classList.remove("modal-open");
    }

    function openDetail(id) {
        const unit = units.find((item) => item.id === id);
        if (!unit) return;
        viewingId = id;
        document.querySelector("#unitDetailLocation").textContent = unit.floor == null
            ? unit.tower
            : `${projects[unit.projectCode]?.name || unit.project} · Tòa ${unit.tower} · Tầng ${unit.floor}`;
        document.querySelector("#unitDetailTitle").textContent = unit.floor == null ? unit.code : `Căn ${unit.number}`;
        document.querySelector("#unitDetailType").textContent = unit.type;
        document.querySelector("#unitDetailArea").textContent = `${unit.area} m²`;
        document.querySelector("#unitDetailPrice").textContent = formatPrice(unit.price);
        document.querySelector("#unitDetailCommission").textContent = unit.commissionPercent != null ? `${unit.commissionPercent}%` : "Chưa thiết lập";
        document.querySelector("#unitDetailProject").textContent = projects[unit.projectCode]?.name || unit.project;
        const attributes = unit.attributes || {};
        const attributeLabels = {
            bedrooms: "Phòng ngủ", bathrooms: "Phòng tắm", storeys: "Số tầng xây dựng",
            frontage: "Mặt tiền (m)", depth: "Chiều sâu (m)", landUse: "Mục đích sử dụng / pháp lý", usage: "Mục đích sử dụng",
        };
        const attributeList = document.querySelector("#unitDetailAttributes");
        const bedroomMatch = /(\d+)\s*phòng ngủ/i.exec(unit.type || "");
        if (attributes.bedrooms == null && bedroomMatch) attributes.bedrooms = Number(bedroomMatch[1]);
        const visibleAttributes = Object.entries(attributes).filter(([key, value]) => value !== "" && value != null && attributeLabels[key]);
        attributeList.replaceChildren(...visibleAttributes.map(([key, value]) => {
            const item = document.createElement("div");
            const term = document.createElement("dt");
            term.textContent = attributeLabels[key];
            const description = document.createElement("dd");
            description.textContent = value;
            item.append(term, description);
            return item;
        }));
        attributeList.hidden = !visibleAttributes.length;
        const badge = document.querySelector("#unitDetailStatus");
        badge.className = `screen-badge ${tone(unit.status)}`;
        badge.textContent = unit.status;
        detailBook.hidden = unit.status !== "Còn bán";
        detailModal.hidden = false;
        document.body.classList.add("modal-open");
        detailModal.querySelector("[data-unit-detail-close]")?.focus();
    }

    function scheduleConsultationFor(unit) {
        if (!unit) return;
        closeDetail();
        const params = new URLSearchParams({
            appointment: "1",
            project: unit.projectCode,
            product: unit.id,
            activity: "Gọi tư vấn",
        });
        location.href = `workflow.html?${params.toString()}#appointments`;
    }

    function updateUnitFormLabels() {
        const group = unitGroup.value || "apartment";
        const apartment = group === "apartment";
        const land = group === "land";
        const house = group === "house";
        unitForm.querySelector('[for="unitTower"]').textContent = apartment ? "Tòa nhà" : land ? "Phân khu / khu vực" : "Khu / dãy";
        unitForm.querySelector('[for="unitFloor"]').textContent = "Tầng";
        unitForm.querySelector('[for="unitNumber"]').textContent = apartment ? "Số căn hộ" : land ? "Mã lô đất" : house ? "Mã căn nhà" : "Mã sản phẩm";
        document.querySelector("#unitFloorField").hidden = !apartment;
        unitForm.elements.floor.required = apartment;
        unitForm.elements.floor.disabled = !apartment;
        unitForm.elements.tower.placeholder = apartment ? "Ví dụ: A2" : land ? "Ví dụ: Phân khu B" : "Ví dụ: Dãy LK-01";
        unitForm.elements.number.placeholder = apartment ? "Ví dụ: 08" : land ? "Ví dụ: N03-12" : house ? "Ví dụ: LK-05" : "Ví dụ: SP-01";
    }

    function updateUnitModalTitle() {
        const title = document.querySelector("#unitModalTitle");
        if (!title) return;
        if (editingId) {
            title.textContent = `Chỉnh sửa ${units.find((item) => item.id === editingId)?.code || "sản phẩm"}`;
            return;
        }
        title.textContent = `Thêm ${unitForm.elements.type.value || productGroupLabels[unitGroup.value] || "sản phẩm"}`;
    }

    function openUnit(id = null) {
        closeDetail();
        editingId = id;
        unitForm.reset();
        const unit = units.find((item) => item.id === id);
        const project = projects[unit?.projectCode || projectFilter.value];
        const projectGroup = window.LandiformCategories?.groupForProject(project) || "apartment";
        const group = unit ? (window.LandiformCategories?.groupForType(unit.type) || "other") : (productGroupLabels[projectGroup] ? projectGroup : "apartment");
        populateUnitGroupOptions(group);
        const apartment = group === "apartment";
        updateUnitTypeOptions(group, unit?.type || "");
        renderUnitAttributes(group, unit?.attributes || {});
        updateUnitModalTitle();
        deleteButton.hidden = !unit || !["Còn bán", "Chưa mở bán"].includes(unit.status);
        if (unit) {
            unitForm.elements.projectCode.value = unit.projectCode;
            for (const field of ["tower", "floor", "number", "area", "price", "commissionPercent", "status"]) {
                unitForm.elements[field].value = unit[field] ?? "";
            }
            unitForm.elements.type.value = unit.type;
        } else if (projectFilter.value) {
            unitForm.elements.projectCode.value = projectFilter.value;
            if (apartment) {
                unitForm.elements.tower.value = selectedTower;
                unitForm.elements.floor.value = selectedFloor ?? "";
            }
        }
        updateUnitFormLabels();
        unitModal.hidden = false;
        document.body.classList.add("modal-open");
        (unit ? unitForm.elements.number : apartment && selectedTower ? unitForm.elements.number : projectFilter.value ? unitForm.elements.tower : unitForm.elements.projectCode).focus();
    }

    search.addEventListener("input", () => { page = 1; render(); });
    projectFilter.addEventListener("change", () => {
        selectedTower = "";
        selectedFloor = null;
        groupFilter.value = "";
        typeFilter.value = "";
        towerFilter.value = "";
        floorFilter.value = "";
        statusFilter.value = "";
        search.value = "";
        listDetails.open = !isApartment(projects[projectFilter.value]);
        page = 1;
        render();
    });
    [typeFilter, towerFilter, floorFilter, statusFilter, groupFilter].filter(Boolean).forEach((select) => select.addEventListener("change", () => {
        if (select === groupFilter) typeFilter.value = "";
        page = 1;
        render();
    }));
    mapTowers.addEventListener("click", (event) => {
        const button = event.target.closest("[data-tower]");
        if (!button) return;
        selectedTower = button.dataset.tower;
        selectedFloor = null;
        renderMap();
    });
    mapFloors.addEventListener("click", (event) => {
        const button = event.target.closest("[data-floor]");
        if (!button) return;
        selectedFloor = Number(button.dataset.floor);
        renderMap();
    });
    mapUnits.addEventListener("click", (event) => {
        const button = event.target.closest("[data-unit-view]");
        if (button) openDetail(button.dataset.unitView);
    });
    function updateBulkPreview() {
        const from = Number(bulkForm.elements.fromFloor.value);
        const to = Number(bulkForm.elements.toFloor.value);
        const perFloor = Number(bulkForm.elements.perFloor.value);
        const count = (to - from + 1) * perFloor;
        const valid = from >= 1 && to >= from && perFloor >= 1 && count <= 500;
        document.querySelector("#bulkPreview").textContent = valid
            ? `Dự kiến tạo ${count.toLocaleString("vi-VN")} căn trong tòa này. Căn đã có sẽ được bỏ qua.`
            : "Chọn khoảng tầng hợp lệ và tối đa 500 căn mỗi lần.";
        bulkForm.querySelector('[type="submit"]').disabled = !valid;
    }
    bulkForm.addEventListener("input", updateBulkPreview);
    bulkForm.addEventListener("change", (event) => {
        if (event.target === bulkForm.elements.projectCode) updateBulkTypeOptions();
        updateBulkPreview();
    });
    previous.addEventListener("click", () => { if (page > 1) { page -= 1; render(); } });
    next.addEventListener("click", () => { page += 1; render(); });
    document.querySelector("[data-unit-add]")?.addEventListener("click", () => openUnit());
    document.querySelector("[data-unit-bulk]")?.addEventListener("click", () => {
        bulkForm.reset();
        if ([...bulkForm.elements.projectCode.options].some((option) => option.value === projectFilter.value)) {
            bulkForm.elements.projectCode.value = projectFilter.value;
        }
        if (selectedTower) bulkForm.elements.tower.value = selectedTower;
        if (selectedFloor != null) {
            bulkForm.elements.fromFloor.value = selectedFloor;
            bulkForm.elements.toFloor.value = selectedFloor;
        }
        updateBulkTypeOptions();
        updateBulkPreview();
        bulkModal.hidden = false;
        document.body.classList.add("modal-open");
        bulkForm.elements.tower.focus();
    });
    tbody.addEventListener("click", (event) => {
        const remove = event.target.closest("[data-inventory-delete]");
        if (remove) {
            const unit = units.find((item) => item.id === remove.dataset.inventoryDelete);
            if (!unit || !window.confirm(`Xóa sản phẩm “${unit.code}” khỏi danh sách hiện tại? Tải lại trang sẽ khôi phục dữ liệu ví dụ.`)) return;
            const next = units.filter((item) => item.id !== unit.id);
            if (!inventory.replace(next)) return notify("Không thể cập nhật danh sách sản phẩm.");
            units = next;
            if (tbody.dataset.staticDemo === "true") remove.closest("tr")?.remove();
            render();
            notify("Đã xóa sản phẩm khỏi danh sách hiện tại.");
            return;
        }
        const consultationButton = event.target.closest("[data-unit-consult]");
        if (consultationButton) {
            scheduleConsultationFor(units.find((item) => item.id === consultationButton.dataset.unitConsult));
            return;
        }
        const button = event.target.closest("[data-unit-edit]");
        if (button) openUnit(button.dataset.unitEdit);
    });
    document.querySelectorAll("[data-unit-close]").forEach((button) => button.addEventListener("click", () => close(unitModal)));
    document.querySelectorAll("[data-unit-bulk-close]").forEach((button) => button.addEventListener("click", () => close(bulkModal)));
    document.querySelectorAll("[data-unit-detail-close]").forEach((button) => button.addEventListener("click", closeDetail));
    detailEdit.addEventListener("click", () => {
        if (viewingId) location.href = `product-detail.html?id=${encodeURIComponent(viewingId)}`;
    });
    detailBook.addEventListener("click", () => { if (viewingId) scheduleConsultationFor(units.find((unit) => unit.id === viewingId)); });
    detailModal.addEventListener("click", (event) => { if (event.target === detailModal) closeDetail(); });
    for (const modal of [unitModal, bulkModal]) {
        modal.addEventListener("click", (event) => { if (event.target === modal) close(modal); });
    }
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            if (!unitModal.hidden) close(unitModal);
            if (!bulkModal.hidden) close(bulkModal);
            if (!detailModal.hidden) closeDetail();
        }
    });
    unitForm.elements.number.addEventListener("input", () => unitForm.elements.number.setCustomValidity(""));
    unitGroup.addEventListener("change", () => {
        updateUnitTypeOptions(unitGroup.value);
        renderUnitAttributes(unitGroup.value);
        updateUnitFormLabels();
        updateUnitModalTitle();
    });
    window.addEventListener("storage", (event) => {
        if (event.key !== "landiform.admin.categories.v1" || unitModal.hidden) return;
        const selectedGroup = unitGroup.value;
        const selectedType = unitForm.elements.type.value;
        const attributeValues = Object.fromEntries([...unitAttributeFields.querySelectorAll('[name^="attribute_"]')]
            .map((input) => [input.name.slice("attribute_".length), input.value]));
        populateUnitGroupOptions(selectedGroup);
        updateUnitTypeOptions(unitGroup.value, selectedType);
        renderUnitAttributes(unitGroup.value, attributeValues);
        updateUnitFormLabels();
        updateUnitModalTitle();
    });
    unitForm.elements.type.addEventListener("change", () => {
        updateUnitModalTitle();
    });
    unitForm.elements.projectCode.addEventListener("change", () => {
        updateUnitFormLabels();
    });
    unitForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = new FormData(unitForm);
        const projectCode = String(values.get("projectCode"));
        const tower = String(values.get("tower")).trim();
        const type = String(values.get("type"));
        const floor = values.get("floor") ? Number(values.get("floor")) : null;
        const number = String(values.get("number")).trim();
        const code = floor != null ? `${tower} · ${String(floor).padStart(2, "0")}.${number.padStart(2, "0")}` : `${tower} · ${number}`;
        if (units.some((unit) => unit.projectCode === projectCode && unit.code.toLocaleLowerCase("vi") === code.toLocaleLowerCase("vi") && unit.id !== editingId)) {
            unitForm.elements.number.setCustomValidity("Mã căn này đã có trong dự án.");
            unitForm.reportValidity();
            return;
        }
        const wasEditing = Boolean(editingId);
        const previousUnit = units.find((unit) => unit.id === editingId);
        const record = {
            id: editingId || `unit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            projectCode,
            project: projects[projectCode]?.name || "Dự án",
            tower, floor, number, code,
            type,
            productGroup: window.LandiformCategories?.groupForType(type) || unitGroup.value,
            categoryId: window.LandiformCategories?.findByName(type)?.id || "",
            attributes: Object.fromEntries([...values.entries()]
                .filter(([key, value]) => key.startsWith("attribute_") && String(value).trim() !== "")
                .map(([key, value]) => [key.slice("attribute_".length), value])),
            area: Number(values.get("area")),
            price: Number(values.get("price")),
            commissionPercent: Number(values.get("commissionPercent")),
            status: String(values.get("status")),
        };
        const nextUnits = editingId ? units.map((unit) => unit.id === editingId ? record : unit) : [...units, record];
        if (!inventory.replace(nextUnits)) return notify("Không thể lưu sản phẩm trên trình duyệt này.");
        close(unitModal);
        notify(wasEditing ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm vào danh mục.");
    });

    deleteButton.addEventListener("click", () => {
        const unit = units.find((item) => item.id === editingId);
        if (!unit || !window.confirm(`Xóa sản phẩm ${unit.code} khỏi danh mục?`)) return;
        if (!inventory.replace(units.filter((item) => item.id !== editingId))) return notify("Không thể xóa sản phẩm trên trình duyệt này.");
        close(unitModal);
        notify("Đã xóa sản phẩm khỏi danh mục.");
    });

    bulkForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const values = new FormData(bulkForm);
        const projectCode = String(values.get("projectCode"));
        const tower = String(values.get("tower")).trim();
        const fromFloor = Number(values.get("fromFloor"));
        const toFloor = Number(values.get("toFloor"));
        const perFloor = Number(values.get("perFloor"));
        const quantity = (toFloor - fromFloor + 1) * perFloor;
        if (toFloor < fromFloor || quantity > 500) {
            notify("Chọn khoảng tầng hợp lệ và tối đa 500 căn mỗi lần.");
            return;
        }
        const existing = new Set(units.filter((unit) => unit.projectCode === projectCode).map((unit) => unit.code.toLocaleLowerCase("vi")));
        const generated = [];
        for (let floor = fromFloor; floor <= toFloor; floor += 1) {
            for (let number = 1; number <= perFloor; number += 1) {
                const unitNumber = String(number).padStart(2, "0");
                const code = `${tower} · ${String(floor).padStart(2, "0")}.${unitNumber}`;
                if (existing.has(code.toLocaleLowerCase("vi"))) continue;
                generated.push({
                    id: `unit-${Date.now()}-${floor}-${number}`,
                    projectCode,
                    project: projects[projectCode]?.name || "Dự án",
                    tower, floor, number: unitNumber, code,
                    type: String(values.get("type")),
                    area: Number(values.get("area")),
                    price: Number(values.get("price")),
                    commissionPercent: Number(values.get("commissionPercent")),
                    status: "Còn bán",
                });
            }
        }
        if (!generated.length) return notify("Các căn trong khoảng này đã có trong danh mục.");
        if (!inventory.replace([...units, ...generated])) return notify("Không thể lưu danh sách căn trên trình duyệt này.");
        close(bulkModal);
        notify(`Đã thêm ${generated.length} căn vào dự án.`);
    });

    document.addEventListener("landiform:inventory-updated", () => {
        units = inventory.all();
        render();
    });
    render();
})();

