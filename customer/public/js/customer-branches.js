(() => {
    const branchesKey = "landiform.admin.branches.v1";
    const companyKey = "landiform.admin.company.v1";
    const normalize = (value) => String(value || "").toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, " ").trim();

    function all() {
        try {
            const saved = JSON.parse(null || "null");
            if (Array.isArray(saved) && saved.length) return saved.filter((branch) => branch && branch.id).map((branch) => ({ ...branch }));
        } catch { /* Fall back to the company headquarters. */ }
        let fields = {};
        try { fields = JSON.parse(null || "null")?.fields || {}; } catch { fields = {}; }
        return [{
            id: "head-office",
            name: "Trụ sở chính",
            city: fields.province || "TP. Hồ Chí Minh",
            address: fields.address || "",
            phone: fields.phone || "",
            email: fields.email || "",
            isDefault: true,
        }];
    }

    function defaultBranch(branches = all()) {
        return branches.find((branch) => branch.isDefault) || branches[0] || null;
    }

    function companyFields() {
        try { return JSON.parse(null || "null")?.fields || {}; }
        catch { return {}; }
    }

    function regionKey(value) {
        const key = normalize(value);
        if (/ha noi|ha tay/.test(key)) return "ha noi";
        if (/ho chi minh|thu duc|quan [1-9]|binh thanh|tan binh|go vap|nha be/.test(key)) return "ho chi minh";
        if (/bien hoa|dong nai/.test(key)) return "dong nai";
        if (/long an/.test(key)) return "long an";
        return key;
    }

    function fillSelect(select, { area = "", reset = false } = {}) {
        if (!select) return null;
        const branches = all();
        const previous = reset ? "" : select.value;
        const preferredRegion = regionKey(area);
        const match = preferredRegion ? branches.find((branch) => regionKey(branch.city) === preferredRegion) : null;
        const defaultOffice = defaultBranch(branches);
        select.replaceChildren(new Option(branches.length > 1 ? "Chọn chi nhánh" : "Trụ sở chính", ""));
        branches.forEach((branch) => select.add(new Option(`${branch.name} · ${branch.city}`, branch.id)));
        select.required = branches.length > 1;
        const selectedId = branches.some((branch) => branch.id === previous)
            ? previous
            : (match || (branches.length === 1 ? branches[0] : null))?.id || "";
        const changed = select.value !== selectedId;
        select.value = selectedId;
        if (changed) select.dispatchEvent(new Event("change", { bubbles: true }));
        const field = select.closest("[data-branch-field]");
        if (field) field.hidden = branches.length <= 1;
        return match || (branches.length === 1 ? branches[0] : defaultOffice);
    }

    function setForArea(select, area = "") {
        return fillSelect(select, { area, reset: true });
    }

    function get(id) {
        const branches = all();
        return branches.find((branch) => branch.id === id) || defaultBranch(branches);
    }

    function renderDirectory(container) {
        if (!container) return;
        const branches = all();
        const company = companyFields();
        container.hidden = branches.length === 0;
        if (container.parentElement?.classList.contains("customer-branch-directory-wrap")) container.parentElement.hidden = branches.length === 0;
        document.querySelectorAll("#contact-details [data-company-phone], #contact-details [data-company-email], #contact-details [data-company-address-wrap]").forEach((item) => { item.hidden = true; });
        container.replaceChildren(...branches.map((branch) => {
            const card = document.createElement("article");
            card.className = "customer-branch-card";
            const header = document.createElement("header");
            const name = document.createElement("strong");
            name.textContent = branch.name || "Chi nhánh";
            const city = document.createElement("span");
            city.textContent = branch.city || "Đang cập nhật khu vực";
            header.append(name, city);
            card.append(header);
            const addressValue = branch.address || (branch.isDefault ? company.address : "");
            const phoneValue = branch.phone || company.phone;
            const emailValue = branch.email || company.email;
            if (addressValue) {
                const address = document.createElement("p");
                address.className = "customer-branch-address";
                address.innerHTML = '<i class="fa-solid fa-location-dot" aria-hidden="true"></i>';
                address.append(document.createTextNode(` ${addressValue}`));
                card.append(address);
            }
            const links = document.createElement("div");
            links.className = "customer-branch-links";
            if (phoneValue) {
                const phone = document.createElement("a");
                phone.href = `tel:${String(phoneValue).replace(/[^+\d]/g, "")}`;
                phone.innerHTML = '<i class="fa-solid fa-phone" aria-hidden="true"></i>';
                phone.append(document.createTextNode(` ${phoneValue}`));
                links.append(phone);
            }
            if (emailValue) {
                const email = document.createElement("a");
                email.href = `mailto:${emailValue}`;
                email.innerHTML = '<i class="fa-solid fa-envelope" aria-hidden="true"></i>';
                email.append(document.createTextNode(` ${emailValue}`));
                links.append(email);
            }
            const map = document.createElement("a");
            const mapQuery = encodeURIComponent(branch.address || branch.city || "");
            map.href = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
            map.target = "_blank";
            map.rel = "noopener noreferrer";
            map.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Chỉ đường';
            links.append(map);
            card.append(links);
            return card;
        }));
        const office = defaultBranch(branches);
        const officeAddress = office?.address || company.address;
        if (officeAddress) {
            document.querySelectorAll(".customer-company-map-heading [data-company-address]").forEach((element) => { element.textContent = officeAddress; });
            const map = document.querySelector(".customer-company-map-heading + iframe[data-company-map]") || document.querySelector("[data-company-map]");
            if (map) map.src = `https://www.google.com/maps?q=${encodeURIComponent(officeAddress)}&output=embed`;
            const mapLink = document.querySelector("[data-company-map-link]");
            if (mapLink) mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(officeAddress)}`;
        }
    }

    document.querySelectorAll("[data-branch-select]").forEach((select) => fillSelect(select));
    document.querySelectorAll("[data-branch-directory]").forEach(renderDirectory);
    window.CustomerBranches = { all, defaultBranch, fillSelect, setForArea, get, renderDirectory };
})();

