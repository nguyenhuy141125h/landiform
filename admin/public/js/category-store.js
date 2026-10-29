(() => {
    function all() {
        const source = document.querySelector("#categoryExampleData") || document.querySelector("#categoryTableBody");
        return [...(source?.querySelectorAll("[data-category-id]") || [])].map((element) => ({
            id: element.dataset.categoryId,
            name: element.dataset.name,
            group: element.dataset.group,
            level: Number(element.dataset.level || 2),
            parentId: element.dataset.parentId || "",
        }));
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
        document.dispatchEvent(new CustomEvent("landiform:backend-submit", { detail: { entity: "categories", categories } }));
        return false;
    }

    window.LandiformCategories = Object.freeze({ all, forProject, findByName, groupForType, groupForProject, save, defaults: all });
})();
