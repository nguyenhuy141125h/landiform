(() => {
    const manager = window.LandiformCategories;
    const inventory = window.LandiformInventory;
    const tbody = document.querySelector("#categoryTableBody");
    const modal = document.querySelector("#categoryModal");
    const form = document.querySelector("#categoryForm");
    const toast = document.querySelector("#toastMessage");
    if (!manager || !tbody || !modal || !form) return;

    let categories = manager.all();
    const transientCategoryIds = new Set();
    let toastTimer;
    const groupNames = { apartment: "Căn hộ", house: "Nhà ở", land: "Đất nền / lô đất", commercial: "Thương mại / văn phòng", other: "Nghỉ dưỡng / loại khác" };
    const levelSelect = form.elements.level;
    const parentField = document.querySelector("#categoryParentField");
    const parentSelect = form.elements.parentId;

    function groupForParentName(name) {
        const value = String(name || "").toLocaleLowerCase("vi");
        const exact = Object.entries(groupNames).find(([, label]) => label.toLocaleLowerCase("vi") === value);
        if (exact) return exact[0];
        if (/căn hộ|chung cư|penthouse|duplex|shophouse/.test(value)) return "apartment";
        if (/nhà|biệt thự/.test(value)) return "house";
        if (/đất|lô/.test(value)) return "land";
        if (/thương mại|văn phòng|office|kho/.test(value)) return "commercial";
        return "other";
    }

    function parentOptions() {
        const customParents = categories.filter((category) => String(category.level) === "1");
        const options = Object.entries(groupNames).map(([group, name]) => ({ id: `group:${group}`, name, group }));
        customParents.forEach((category) => {
            const duplicateIndex = options.findIndex((option) => option.name.toLocaleLowerCase("vi") === category.name.toLocaleLowerCase("vi"));
            if (duplicateIndex >= 0) options[duplicateIndex] = category;
            else options.push(category);
        });
        return options;
    }

    function refreshParentOptions(selected = "") {
        const options = parentOptions();
        parentSelect.replaceChildren(new Option("Chọn danh mục cha", ""));
        options.forEach((parent) => parentSelect.add(new Option(parent.name, parent.id)));
        if (selected && options.some((parent) => parent.id === selected)) parentSelect.value = selected;
        else if (options.length) parentSelect.value = options[0].id;
    }

    function updateLevelFields() {
        const isChild = levelSelect.value === "2";
        parentField.hidden = !isChild;
        parentSelect.required = isChild;
        form.elements.name.placeholder = isChild ? "Ví dụ: Căn hộ 2 phòng ngủ" : "Ví dụ: Căn hộ";
        updateHierarchyPreview();
    }

    function notify(message) {
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function render() {
        if (tbody.dataset.staticDemo === "true") {
            const activeIds = new Set(categories.map((item) => item.id));
            tbody.querySelectorAll("tr[data-transient-category]").forEach((row) => {
                if (!activeIds.has(row.dataset.categoryId)) row.remove();
            });
            transientCategoryIds.forEach((id) => {
                const category = categories.find((item) => item.id === id);
                if (!category || tbody.querySelector(`tr[data-category-id="${CSS.escape(id)}"]`)) return;
                const row = document.createElement("tr");
                row.dataset.categoryId = id;
                row.dataset.transientCategory = "";
                const name = document.createElement("td");
                name.innerHTML = `<strong>${category.name.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character])}</strong>`;
                const parent = document.createElement("td");
                parent.textContent = String(category.level) === "1" ? `Cấp 1 · ${groupNames[category.group] || "Nhóm bất động sản"}` : `Cấp 2 · ${category.parentName || groupNames[category.group] || "Loại khác"}`;
                const usage = document.createElement("td");
                usage.textContent = String((inventory?.all() || []).filter((unit) => unit.categoryId === id || unit.type === category.name).length);
                const actions = document.createElement("td");
                actions.className = "category-actions-cell";
                const edit = document.createElement("button");
                edit.type = "button"; edit.className = "button button-quiet"; edit.textContent = "Sửa";
                edit.addEventListener("click", () => open(category));
                const remove = document.createElement("button");
                remove.type = "button"; remove.className = "button button-quiet category-delete-button"; remove.dataset.categoryDelete = ""; remove.textContent = "Xóa";
                actions.append(edit, remove);
                row.append(name, parent, usage, actions);
                tbody.append(row);
            });
            return;
        }
        const units = inventory?.all() || [];
        tbody.replaceChildren(...categories.map((category) => {
            const row = document.createElement("tr");
            const name = document.createElement("td");
            const strong = document.createElement("strong");
            strong.textContent = category.name;
            name.append(strong);
            const group = document.createElement("td");
            group.textContent = String(category.level) === "1"
                ? `Cấp 1 · ${groupNames[category.group] || "Loại khác"}`
                : `Cấp 2 · ${category.parentName || groupNames[category.group] || "Loại khác"}`;
            const usage = document.createElement("td");
            usage.textContent = units.filter((unit) => unit.categoryId === category.id || unit.type === category.name).length.toLocaleString("vi-VN");
            const actions = document.createElement("td");
            actions.className = "category-actions-cell";
            const edit = document.createElement("button");
            edit.type = "button";
            edit.className = "button button-quiet";
            edit.textContent = "Sửa";
            edit.addEventListener("click", () => open(category));
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "button button-quiet category-delete-button";
            remove.textContent = "Xóa";
            remove.addEventListener("click", () => removeCategory(category));
            actions.append(edit, remove);
            row.append(name, group, usage, actions);
            return row;
        }));
        if (!categories.length) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 4;
            cell.textContent = "Chưa có danh mục. Hãy thêm danh mục đầu tiên.";
            row.append(cell);
            tbody.append(row);
        }
    }

    function updateHierarchyPreview() {
        const isChild = levelSelect.value === "2";
        const selectedParent = parentOptions().find((item) => item.id === parentSelect.value);
        const parentName = isChild ? (selectedParent?.name || "Danh mục cha") : "Nhóm bất động sản";
        const name = form.elements.name.value.trim() || "Tên danh mục";
        document.querySelector("#categoryPreviewParent").textContent = isChild ? parentName : "Nhóm bất động sản";
        document.querySelector("#categoryPreviewChild").textContent = name;
        document.querySelector(".category-hierarchy-preview").classList.toggle("is-level-one", !isChild);
    }

    function open(category = null) {
        form.reset();
        form.elements.id.value = category?.id || "";
        form.elements.name.value = category?.name || "";
        levelSelect.value = category ? String(category.level || 2) : "1";
        refreshParentOptions(category?.parentId || (category ? `group:${category.group}` : ""));
        document.querySelector("#categoryModalTitle").textContent = category ? "Sửa danh mục" : "Thêm danh mục";
        form.querySelector('[type="submit"]').textContent = category ? "Lưu thay đổi" : "Lưu danh mục";
        updateLevelFields();
        modal.hidden = false;
        document.body.classList.add("modal-open");
        form.elements.name.focus();
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
    }

    function removeCategory(category) {
        const childCount = categories.filter((item) => item.parentId === category.id).length;
        if (childCount) {
            notify(`Danh mục cha đang có ${childCount} danh mục con. Hãy chuyển hoặc xóa danh mục con trước.`);
            return;
        }
        const usage = (inventory?.all() || []).filter((unit) => unit.categoryId === category.id || unit.type === category.name).length;
        if (usage) {
            notify(`Danh mục này đang được ${usage} sản phẩm sử dụng. Hãy đổi sản phẩm sang danh mục khác trước khi xóa.`);
            return;
        }
        const message = `Xóa danh mục “${category.name}”?`;
        if (!window.confirm(message)) return;
        const next = categories.filter((item) => item.id !== category.id);
        if (!manager.save(next)) return notify("Không thể lưu danh mục trên trình duyệt này.");
        categories = next;
        transientCategoryIds.delete(category.id);
        render();
        notify("Đã xóa danh mục.");
    }

    document.querySelector("[data-category-create]")?.addEventListener("click", () => open());
    form.elements.name.addEventListener("input", updateHierarchyPreview);
    levelSelect.addEventListener("change", updateLevelFields);
    parentSelect.addEventListener("change", updateHierarchyPreview);
    document.querySelectorAll("[data-category-close]").forEach((button) => button.addEventListener("click", close));
    tbody.addEventListener("click", (event) => {
        const remove = event.target.closest("[data-category-delete]");
        if (!remove) return;
        const row = remove.closest("tr");
        const name = row?.cells[0]?.textContent.trim() || "danh mục";
        const category = categories.find((item) => item.id === row?.dataset.categoryId || item.name === name);
        if (row?.hasAttribute("data-transient-category") && category) {
            removeCategory(category);
            return;
        }
        if (!window.confirm(`Xóa “${name}” khỏi danh sách hiện tại? Tải lại trang sẽ khôi phục ví dụ HTML.`)) return;
        row?.remove();
        notify("Đã xóa danh mục khỏi danh sách hiện tại.");
    });
    modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) close(); });
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const id = form.elements.id.value || `category-${Date.now()}`;
        const name = form.elements.name.value.trim();
        if (!name) {
            form.elements.name.setCustomValidity("Hãy nhập tên danh mục.");
            form.elements.name.reportValidity();
            return;
        }
        form.elements.name.setCustomValidity("");
        const isChild = levelSelect.value === "2";
        const selectedParent = isChild ? parentOptions().find((item) => item.id === parentSelect.value) : null;
        const group = isChild ? selectedParent?.group : groupForParentName(name);
        const parentId = isChild ? selectedParent?.id : "";
        if (!group || (isChild && !selectedParent)) return notify("Hãy chọn danh mục cha hợp lệ.");
        const existing = categories.find((item) => item.id !== id && item.name.toLocaleLowerCase("vi") === name.toLocaleLowerCase("vi"));
        if (existing) {
            form.elements.name.setCustomValidity("Tên danh mục này đã tồn tại.");
            form.elements.name.reportValidity();
            form.elements.name.addEventListener("input", () => form.elements.name.setCustomValidity(""), { once: true });
            return;
        }
        const previous = categories.find((item) => item.id === id);
        const categoryData = {
            id,
            name,
            group,
            level: isChild ? 2 : 1,
            ...(isChild ? { parentId, parentName: selectedParent.name } : {}),
        };
        if (!previous) transientCategoryIds.add(id);
        let next = previous
            ? categories.map((item) => item.id === id ? categoryData : item)
            : [...categories, categoryData];
        if (previous && String(previous.level) === "1") {
            next = next.map((item) => item.parentId === previous.id
                ? { ...item, group, parentName: name }
                : item);
        }
        if (!manager.save(next)) return notify("Không thể lưu danh mục trên trình duyệt này.");
        if (previous && String(previous.level || 2) === "2" && previous.name !== name && inventory) {
            const units = inventory.all();
            let changed = false;
            units.forEach((unit) => { if (unit.categoryId === previous.id || unit.type === previous.name) { unit.type = name; unit.categoryId = previous.id; changed = true; } });
            if (changed && !inventory.replace(units)) {
                manager.save(categories);
                return notify("Chưa đổi tên được vì không thể cập nhật các sản phẩm đang dùng danh mục này.");
            }
        }
        categories = next;
        render();
        close();
        notify(previous ? "Đã cập nhật danh mục." : isChild ? "Đã thêm danh mục con." : "Đã thêm danh mục cấp 1.");
    });
    render();
})();

