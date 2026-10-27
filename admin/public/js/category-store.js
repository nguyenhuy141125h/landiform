(() => {
    const key = "landiform.admin.categories.v1";
    const defaults = [
        ["Căn hộ studio", "apartment"], ["Căn hộ 1 phòng ngủ", "apartment"], ["Căn hộ 2 phòng ngủ", "apartment"], ["Căn hộ 3 phòng ngủ", "apartment"], ["Căn hộ 4 phòng ngủ", "apartment"], ["Penthouse", "apartment"], ["Duplex", "apartment"], ["Shophouse", "commercial"],
        ["Nhà phố", "house"], ["Nhà phố liền kề", "house"], ["Nhà phố thương mại", "house"], ["Nhà riêng", "house"], ["Biệt thự song lập", "house"], ["Biệt thự đơn lập", "house"],
        ["Đất nền", "land"], ["Đất nền dự án", "land"], ["Đất thổ cư", "land"],
        ["Officetel", "commercial"], ["Văn phòng", "commercial"], ["Mặt bằng thương mại", "commercial"], ["Kho / nhà xưởng", "commercial"],
        ["Biệt thự nghỉ dưỡng", "other"], ["Condotel", "other"],
    ].map(([name, group], index) => ({ id: `category-${index + 1}`, name, group }));
    let memory = null;

    function all() {
        try {
            const saved = JSON.parse(null || "null");
            if (Array.isArray(saved)) return saved.filter((item) => item && item.id && item.name && item.group);
        } catch { /* Use the standard catalog if browser storage is unavailable. */ }
        return (memory || defaults).map((item) => ({ ...item }));
    }

    function groupForProject(project) {
        const type = String(project?.type || "").toLocaleLowerCase("vi");
        if (/căn hộ|chung cư|tòa nhà/.test(type)) return "apartment";
        if (/nhà phố|nhà riêng|biệt thự/.test(type)) return "house";
        if (/đất|lô/.test(type)) return "land";
        if (/thương mại|văn phòng/.test(type)) return "commercial";
        if (/nghỉ dưỡng|resort/.test(type)) return "other";
        return "all";
    }

    function forProject(project) {
        const categories = all().filter((item) => String(item.level || 2) !== "1");
        const group = groupForProject(project);
        const matched = group === "all" ? categories : categories.filter((item) => item.group === group || (["apartment", "house"].includes(group) && item.group === "commercial" && item.name === "Shophouse"));
        return matched.length ? matched.map((item) => item.name) : categories.map((item) => item.name);
    }

    function findByName(name) {
        return all().find((item) => String(item.level || 2) !== "1" && item.name.toLocaleLowerCase("vi") === String(name || "").toLocaleLowerCase("vi")) || null;
    }

    function groupForType(name) {
        return findByName(name)?.group || "other";
    }

    function save(categories) {
        try {
            memory = categories.map((item) => ({ ...item }));
            document.dispatchEvent(new CustomEvent("landiform:categories-updated"));
            return true;
        } catch { return false; }
    }

    window.LandiformCategories = Object.freeze({ all, forProject, findByName, groupForType, groupForProject, save, defaults: () => defaults.map((item) => ({ ...item })) });
})();

