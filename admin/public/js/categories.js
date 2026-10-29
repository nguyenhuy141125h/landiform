(() => {
    const modal = document.querySelector("#categoryModal");
    const form = document.querySelector("#categoryForm");
    const level = document.querySelector("#categoryLevel");
    const parentField = document.querySelector("#categoryParentField");
    const parent = document.querySelector("#categoryParent");
    if (!modal || !form || !level || !parentField || !parent) return;

    function updatePreview() {
        const child = level.value === "2";
        parentField.hidden = !child;
        parent.required = child;
        form.elements.name.placeholder = child ? "Ví dụ: Căn hộ 2 phòng ngủ" : "Ví dụ: Căn hộ";
        document.querySelector("#categoryPreviewParent").textContent = child ? (parent.selectedOptions[0]?.textContent || "Danh mục cha") : "Nhóm bất động sản";
        document.querySelector("#categoryPreviewChild").textContent = form.elements.name.value.trim() || "Tên danh mục";
        document.querySelector(".category-hierarchy-preview")?.classList.toggle("is-level-one", !child);
    }

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
        updatePreview();
    }

    document.querySelector("[data-category-create]")?.addEventListener("click", () => {
        form.reset();
        document.querySelector("#categoryModalTitle").textContent = "Thêm danh mục";
        form.querySelector('[type="submit"]').textContent = "Lưu danh mục";
        updatePreview();
        modal.hidden = false;
        document.body.classList.add("modal-open");
        form.elements.name.focus();
    });
    level.addEventListener("change", updatePreview);
    parent.addEventListener("change", updatePreview);
    form.elements.name.addEventListener("input", updatePreview);
    document.querySelectorAll("[data-category-close]").forEach((button) => button.addEventListener("click", close));
    modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) close(); });
    form.addEventListener("submit", (event) => event.preventDefault());
    updatePreview();
})();
