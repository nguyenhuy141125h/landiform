(() => {
    const key = "landiform.admin.units.v1";
    const seed = [
        { id: "unit-ap-a2-1208", projectCode: "AP-026", project: "An Phú Riverside", tower: "A2", floor: 12, number: "08", code: "A2 · 12.08", type: "Căn hộ 2 phòng ngủ", area: 82, price: 3.8, status: "Chờ duyệt" },
        { id: "unit-ap-a2-1209", projectCode: "AP-026", project: "An Phú Riverside", tower: "A2", floor: 12, number: "09", code: "A2 · 12.09", type: "Căn hộ 2 phòng ngủ", area: 82, price: 3.9, status: "Còn bán" },
        { id: "unit-ap-a2-1210", projectCode: "AP-026", project: "An Phú Riverside", tower: "A2", floor: 12, number: "10", code: "A2 · 12.10", type: "Căn hộ 3 phòng ngủ", area: 105, price: 5.2, status: "Còn bán" },
        { id: "unit-ap-a2-1301", projectCode: "AP-026", project: "An Phú Riverside", tower: "A2", floor: 13, number: "01", code: "A2 · 13.01", type: "Căn hộ 1 phòng ngủ", area: 58, price: 2.8, status: "Còn bán" },
        { id: "unit-ap-a1-0501", projectCode: "AP-026", project: "An Phú Riverside", tower: "A1", floor: 5, number: "01", code: "A1 · 05.01", type: "Căn hộ 2 phòng ngủ", area: 78, price: 3.5, status: "Đã bán" },
        { id: "unit-ap-a1-0502", projectCode: "AP-026", project: "An Phú Riverside", tower: "A1", floor: 5, number: "02", code: "A1 · 05.02", type: "Căn hộ 2 phòng ngủ", area: 78, price: 3.5, status: "Còn bán" },
        { id: "unit-cp-b1-0803", projectCode: "CP-008", project: "Central Park Towers", tower: "B1", floor: 8, number: "03", code: "B1 · 08.03", type: "Căn hộ 3 phòng ngủ", area: 104, price: 5.1, status: "Đã bán" },
        { id: "unit-cp-b1-0804", projectCode: "CP-008", project: "Central Park Towers", tower: "B1", floor: 8, number: "04", code: "B1 · 08.04", type: "Căn hộ 2 phòng ngủ", area: 79, price: 3.7, status: "Còn bán" },
        { id: "unit-cp-b2-1001", projectCode: "CP-008", project: "Central Park Towers", tower: "B2", floor: 10, number: "01", code: "B2 · 10.01", type: "Căn hộ 2 phòng ngủ", area: 80, price: 3.8, status: "Còn bán" },
        { id: "unit-gv-n08-05", projectCode: "GV-014", project: "Green Valley", tower: "N08", floor: null, number: "05", code: "N08 · 05", type: "Nhà phố", area: 165, price: 8.2, status: "Đã bán" },
        { id: "unit-lg-17", projectCode: "LG-031", project: "Lumière Garden", tower: "Phân khu 1", floor: null, number: "17", code: "LG · 17", type: "Đất nền", area: 120, price: 2.4, status: "Chưa mở bán" },
        { id: "unit-gv-house-026", projectCode: "GV-014", project: "Green Valley", tower: "Khu dân cư A", floor: null, number: "26", code: "GV · A.26", type: "Nhà riêng", area: 96, price: 6.6, status: "Còn bán" },
        { id: "unit-lg-lot-021", projectCode: "LG-031", project: "Lumière Garden", tower: "Phân khu 1", floor: null, number: "21", code: "LG · 21", type: "Đất nền", area: 120, price: 2.4, status: "Còn bán" },
        { id: "unit-lg-lot-022", projectCode: "LG-031", project: "Lumière Garden", tower: "Phân khu 2", floor: null, number: "22", code: "LG · 22", type: "Đất thổ cư", area: 150, price: 3.1, status: "Còn bán" },
        { id: "unit-ap-a2-1506", projectCode: "AP-026", project: "An Phú Riverside", tower: "A2", floor: 15, number: "06", code: "A2 · 15.06", type: "Căn hộ 2 phòng ngủ", area: 82, price: 3.8, status: "Đã bán" },
        { id: "unit-gv-n08-06", projectCode: "GV-014", project: "Green Valley", tower: "N08", floor: null, number: "06", code: "N08 · 06", type: "Nhà phố", area: 168, price: 8.4, status: "Còn bán" },
    ];
    const categoryByType = {
        "Căn hộ studio": "category-1", "Căn hộ 1 phòng ngủ": "category-2", "Căn hộ 2 phòng ngủ": "category-3",
        "Căn hộ 3 phòng ngủ": "category-4", "Nhà phố": "category-9", "Nhà riêng": "category-12",
        "Đất nền": "category-15", "Đất nền dự án": "category-16", "Đất thổ cư": "category-17",
    };
    const demoRelationshipVersion = "landiform.admin.demo-relations.inventory.v3";
    const additions = new Set(["unit-gv-house-026", "unit-lg-lot-021", "unit-lg-lot-022", "unit-ap-a2-1506", "unit-gv-n08-06"]);
    seed.forEach((unit) => {
        unit.categoryId = categoryByType[unit.type] || "";
        const bedrooms = unit.type.match(/(\d+) phòng ngủ/i);
        if (bedrooms) unit.attributes = { ...(unit.attributes || {}), bedrooms: Number(bedrooms[1]) };
    });
    let memory = null;

    function migrateSavedUnits(saved) {
        const canonical = new Map(seed.map((unit) => [unit.id, unit]));
        const next = saved.map((unit) => {
            const example = canonical.get(unit?.id);
            const catalog = window.LandiformCategories?.all() || [];
            const matchedCategory = catalog.find((item) => item.id === unit?.categoryId) || window.LandiformCategories?.findByName(unit?.type);
            const attributes = { ...(example?.attributes || {}), ...(unit?.attributes || {}) };
            const bedroomCount = /(\d+)\s*phòng ngủ/i.exec(unit?.type || "");
            if (attributes.bedrooms == null && bedroomCount) attributes.bedrooms = Number(bedroomCount[1]);
            const normalized = {
                ...unit,
                ...(matchedCategory ? { type: matchedCategory.name } : {}),
                categoryId: matchedCategory?.id || categoryByType[unit?.type] || unit?.categoryId || example?.categoryId || "",
                attributes,
            };
            if (!example) return normalized;
            if (unit.id === "unit-gv-house-026" && unit.type === "Nhà riêng lẻ") normalized.type = example.type;
            if (unit.id === "unit-lg-lot-022" && unit.type === "Lô đất riêng lẻ") normalized.type = example.type;
            if (unit.id === "unit-cp-b1-0803" && unit.status === "Đang giữ chỗ") normalized.status = example.status;
            if (unit.id === "unit-gv-n08-05" && unit.status === "Còn bán") normalized.status = example.status;
            return normalized;
        });
        const ids = new Set(next.map((unit) => unit?.id));
        const missing = seed.filter((unit) => additions.has(unit.id) && !ids.has(unit.id));
        const merged = [...next, ...missing];
        try {
            void 0;
            void 0;
        } catch { /* Keep the normalized examples in memory if browser storage is full. */ }
        return merged;
    }

    function all() {
        try {
            const saved = JSON.parse(null || "null");
            if (Array.isArray(saved)) {
                return migrateSavedUnits(saved);
            }
        } catch {
            // Dữ liệu mẫu vẫn hiển thị nếu trình duyệt không đọc được bộ nhớ.
        }
        return memory ? memory.map((unit) => ({ ...unit })) : seed.map((unit) => ({ ...unit, categoryId: window.LandiformCategories?.findByName(unit.type)?.id || unit.categoryId || "" }));
    }

    function replace(units) {
        memory = units.map((unit) => ({ ...unit }));
        document.dispatchEvent(new CustomEvent("landiform:inventory-updated"));
        return true;
    }

    window.LandiformInventory = Object.freeze({ all, replace });
})();

