/* --- customer-ui.js --- */
(() => {
    // Customer forms only demonstrate the interaction; they do not send or store data.
    const toastTimers = new WeakMap();
    window.LandiformCustomerUI = Object.freeze({
        notify(toast, message, duration = 3500) {
            if (!toast) return;
            toast.textContent = message;
            toast.classList.add("is-visible");
            clearTimeout(toastTimers.get(toast));
            toastTimers.set(
                toast,
                window.setTimeout(
                    () => toast.classList.remove("is-visible"),
                    duration,
                ),
            );
        },
        formatPrice(value) {
            const price = Number(value);
            return Number.isFinite(price)
                ? `${price.toLocaleString("vi-VN", { maximumFractionDigits: 2 })} tỷ`
                : "Liên hệ";
        },
    });

    document.addEventListener(
        "submit",
        (event) => {
            const form = event.target;
            if (form instanceof HTMLFormElement) event.preventDefault();
        },
        true,
    );

    document.addEventListener("submit", (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement) || form.id === "heroSearchForm")
            return;
        if (
            ![
                "appointmentRequestForm",
                "qrRegistrationForm",
                "contactRequestForm",
            ].includes(form.id)
        )
            return;
        if (!form.reportValidity()) return;
        const message =
            "Đã mô phỏng gửi yêu cầu. Dữ liệu không được lưu trong bản xem thử.";
        const status = document.querySelector("#contactFormStatus");
        if (status && form.id === "contactRequestForm")
            status.textContent = message;
        const toast = document.querySelector(
            "#storeToast, #contactToast, #detailToast",
        );
        if (toast) {
            toast.textContent = message;
            toast.classList.add("is-visible");
            window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
        }
        form.reset();
        const modal = form.closest(".store-modal-backdrop");
        if (modal) {
            modal.hidden = true;
            document.body.classList.remove("store-modal-open");
        }
    });
})();

(() => {
    const year = document.querySelector("#currentYear");
    if (year) year.textContent = String(new Date().getFullYear());
})();

(() => {
    const normalize = (value) =>
        String(value || "")
            .toLocaleLowerCase("vi")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\u0111/g, "d")
            .trim();

    function all() {
        const options = [
            ...document.querySelectorAll(
                "[data-branch-select] option[value]:not([value=''])",
            ),
        ];
        return options.map((option) => ({
            id: option.value,
            name: option.textContent.split("\u00b7")[0].trim(),
            city: option.dataset.city || "",
            address: option.dataset.address || "",
            phone: option.dataset.phone || "",
            email: option.dataset.email || "",
            isDefault: option.selected || option.dataset.default === "true",
        }));
    }
    function defaultBranch(branches = all()) {
        return (
            branches.find((branch) => branch.isDefault) || branches[0] || null
        );
    }
    function regionKey(value) {
        const key = normalize(value);
        if (/ha noi|ha tay/.test(key)) return "ha noi";
        if (
            /ho chi minh|thu duc|quan [1-9]|binh thanh|tan binh|go vap|nha be/.test(
                key,
            )
        )
            return "ho chi minh";
        if (/bien hoa|dong nai/.test(key)) return "dong nai";
        if (/long an/.test(key)) return "long an";
        return key;
    }
    function fillSelect(select, { area = "", reset = false } = {}) {
        if (!select) return null;
        const branches = all();
        const previous = reset ? "" : select.value;
        const preferred = regionKey(area);
        const match = preferred
            ? branches.find((branch) => regionKey(branch.city) === preferred)
            : null;
        const chosen =
            branches.find((branch) => branch.id === previous) ||
            match ||
            defaultBranch(branches);
        select.value = chosen?.id || "";
        select.required = branches.length > 1;
        const field = select.closest("[data-branch-field]");
        if (field) field.hidden = branches.length <= 1;
        return chosen || null;
    }
    function setForArea(select, area = "") {
        return fillSelect(select, { area, reset: true });
    }
    function get(id) {
        const branches = all();
        return (
            branches.find((branch) => branch.id === id) ||
            defaultBranch(branches)
        );
    }
    function renderDirectory(container) {
        if (!container) return;
        const hasCards = Boolean(
            container.querySelector(".customer-branch-card"),
        );
        container.hidden = !hasCards;
        const wrapper = container.closest(".customer-branch-directory-wrap");
        if (wrapper) wrapper.hidden = !hasCards;
        if (hasCards)
            document
                .querySelectorAll(
                    "#contact-details [data-company-phone], #contact-details [data-company-email], #contact-details [data-company-address-wrap]",
                )
                .forEach((item) => {
                    item.hidden = true;
                });
    }
    document
        .querySelectorAll("[data-branch-select]")
        .forEach((select) => fillSelect(select));
    document
        .querySelectorAll("[data-branch-directory]")
        .forEach(renderDirectory);
    window.CustomerBranches = {
        all,
        defaultBranch,
        fillSelect,
        setForArea,
        get,
        renderDirectory,
    };
})();

(() => {
    const form = document.querySelector("#contactRequestForm");
    if (!form) return;
    const projectSelect = form.elements.projectCode;
    const branchSelect = form.elements.branchId;
    if (!projectSelect || !branchSelect) return;
    projectSelect.addEventListener("change", () => {
        const area = projectSelect.selectedOptions[0]?.dataset.area || "";
        window.CustomerBranches?.setForArea(branchSelect, area);
    });
})();

/* --- inventory.js --- */
(() => {
    const source = document.querySelector(
        "#inventoryCatalogExamples, #productRecordExamples",
    );
    if (!source && !document.querySelector("#inventoryTableBody")) return;
    let demoRecords = null;

    function fromMarkup() {
        if (!source) return [];
        return [...source.querySelectorAll("[data-id]")].map((element) => {
            const data = { ...element.dataset };
            const floorMatch = /\d+/.exec(data.floor || "");
            const numeric = (value) =>
                value === "" || value == null
                    ? null
                    : Number(String(value).replace(",", "."));
            const attributes = {};
            ["bedrooms", "bathrooms", "storeys", "frontage", "depth"].forEach(
                (key) => {
                    if (data[key] !== "" && data[key] != null)
                        attributes[key] = numeric(data[key]);
                },
            );
            if (data.legalUse) attributes.legalUse = data.legalUse;
            return {
                id: data.id,
                projectCode: data.projectCode || "",
                project: data.project || "",
                projectArea: data.projectArea || "",
                projectType: data.projectType || "",
                formId: data.formId || "",
                address: data.address || "",
                image: data.image || "",
                galleryImages: data.gallery ? data.gallery.split("|") : [],
                tower: data.zone || "",
                floor: floorMatch ? Number(floorMatch[0]) : null,
                number:
                    String(data.code || "")
                        .split(/[·.]/)
                        .pop()
                        ?.trim() || "",
                code: data.code || "",
                type: data.type || "",
                area: numeric(data.area),
                price: numeric(data.price),
                commissionPercent: numeric(data.commission),
                status: data.status || "",
                productGroup: data.group || "",
                categoryId:
                    window.LandiformCategories?.findByName(data.type)?.id || "",
                attributes,
            };
        });
    }

    function fromInventoryTable() {
        const body = document.querySelector("#inventoryTableBody");
        if (!body) return [];
        const projectOptions = [
            ...document.querySelectorAll("#inventoryProjectFilter option"),
        ];
        return [...body.querySelectorAll("tr")]
            .map((row) => {
                const cells = [...row.cells];
                if (cells.length < 10) return null;
                const project = cells[1].textContent.trim();
                const projectCode =
                    projectOptions.find(
                        (option) => option.textContent.trim() === project,
                    )?.value || "";
                const href =
                    row.querySelector('a[href*="product-detail.html"]')?.href ||
                    "";
                const id =
                    new URL(href, location.href).searchParams.get("id") ||
                    row.dataset.unitId ||
                    "";
                const type = cells[4].textContent.trim();
                const specification = cells[5].textContent.trim();
                const bedroomCount = /([0-9]+)\s*PN/i.exec(specification);
                const bathroomCount = /([0-9]+)\s*PT/i.exec(specification);
                const floorMatch = /\d+/.exec(cells[3].textContent);
                const parseNumber = (value) =>
                    Number(
                        String(value || "")
                            .replace(/[^0-9,.-]/g, "")
                            .replace(",", "."),
                    ) || 0;
                return {
                    id,
                    projectCode,
                    project,
                    address: row.dataset.address || "",
                    tower: cells[2].textContent.trim(),
                    floor: floorMatch ? Number(floorMatch[0]) : null,
                    code: cells[0].textContent.trim(),
                    type,
                    area: parseNumber(cells[6].textContent),
                    price: parseNumber(cells[7].textContent),
                    commissionPercent: parseNumber(cells[8].textContent),
                    status: cells[9].textContent.trim(),
                    categoryId:
                        window.LandiformCategories?.findByName(type)?.id || "",
                    attributes: {
                        ...(bedroomCount
                            ? { bedrooms: Number(bedroomCount[1]) }
                            : {}),
                        ...(bathroomCount
                            ? { bathrooms: Number(bathroomCount[1]) }
                            : {}),
                    },
                };
            })
            .filter((unit) => unit && unit.id);
    }

    function all() {
        if (demoRecords)
            return demoRecords.map((record) => ({
                ...record,
                attributes: { ...(record.attributes || {}) },
                galleryImages: [...(record.galleryImages || [])],
            }));
        const markupRecords = fromMarkup();
        return markupRecords.length ? markupRecords : fromInventoryTable();
    }

    function replace(records) {
        demoRecords = records.map((record) => ({
            ...record,
            attributes: { ...(record.attributes || {}) },
            galleryImages: [...(record.galleryImages || [])],
        }));
        document.dispatchEvent(
            new CustomEvent("landiform:inventory-updated", {
                detail: { records: all() },
            }),
        );
        return true;
    }

    window.LandiformInventory = Object.freeze({ all, replace });
})();

/* --- customer-date-picker.js --- */
(() => {
    const pickers = document.querySelectorAll("[data-date-picker]");
    if (!pickers.length) return;

    const pad = (value) => String(value).padStart(2, "0");
    const toIso = (date) =>
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const fromIso = (value) => {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
        if (!match) return null;
        const date = new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3]),
        );
        return date.getFullYear() === Number(match[1]) &&
            date.getMonth() === Number(match[2]) - 1 &&
            date.getDate() === Number(match[3])
            ? date
            : null;
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = toIso(today);
    const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

    pickers.forEach((picker) => {
        const display = picker.querySelector(".date-picker-value");
        const value = picker.querySelector('input[name="date"]');
        const toggle = picker.querySelector(".date-picker-toggle");
        const popover = picker.querySelector(".date-picker-popover");
        const title = picker.querySelector("[data-date-title]");
        const days = picker.querySelector(".date-picker-days");
        const weekdaysEl = picker.querySelector(".date-picker-weekdays");
        const previous = picker.querySelector("[data-date-prev]");
        const next = picker.querySelector("[data-date-next]");
        const todayButton = picker.querySelector("[data-date-today]");
        let shownMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        weekdaysEl.replaceChildren(
            ...weekdays.map((day) => {
                const cell = document.createElement("span");
                cell.textContent = day;
                return cell;
            }),
        );

        function close() {
            popover.hidden = true;
            display.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-expanded", "false");
        }
        function open() {
            if (value.value) {
                const selected = fromIso(value.value);
                if (selected)
                    shownMonth = new Date(
                        selected.getFullYear(),
                        selected.getMonth(),
                        1,
                    );
            }
            popover.hidden = false;
            display.setAttribute("aria-expanded", "true");
            toggle.setAttribute("aria-expanded", "true");
            render();
            popover.style.position = "fixed";
            popover.style.top = "0px";
            popover.style.left = "0px";
            const anchor = display.getBoundingClientRect();
            const box = popover.getBoundingClientRect();
            const gap = 8;
            const top =
                anchor.bottom + box.height + gap <= window.innerHeight - 12
                    ? anchor.bottom + gap
                    : Math.max(12, anchor.top - box.height - gap);
            const left = Math.min(
                Math.max(12, anchor.left),
                window.innerWidth - box.width - 12,
            );
            popover.style.top = `${top}px`;
            popover.style.left = `${left}px`;
        }
        function setDate(date) {
            value.value = toIso(date);
            display.value = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
            display.setCustomValidity("");
            close();
        }
        function parseDisplay() {
            const raw = display.value.trim();
            if (!raw) {
                value.value = "";
                display.setCustomValidity("");
                return;
            }
            const match = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(raw);
            if (!match) {
                value.value = "";
                display.setCustomValidity(
                    "Nhập ngày theo định dạng ngày/tháng/năm hoặc chọn trên lịch.",
                );
                return;
            }
            const date = new Date(
                Number(match[3]),
                Number(match[2]) - 1,
                Number(match[1]),
            );
            if (
                date.getFullYear() !== Number(match[3]) ||
                date.getMonth() !== Number(match[2]) - 1 ||
                date.getDate() !== Number(match[1])
            ) {
                value.value = "";
                display.setCustomValidity("Ngày bạn nhập không hợp lệ.");
                return;
            }
            if (toIso(date) < todayIso) {
                value.value = "";
                display.setCustomValidity(
                    "Vui lòng chọn ngày từ hôm nay trở đi.",
                );
                return;
            }
            value.value = toIso(date);
            display.value = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
            display.setCustomValidity("");
        }
        function render() {
            title.textContent = new Intl.DateTimeFormat("vi-VN", {
                month: "long",
                year: "numeric",
            }).format(shownMonth);
            const monthStart = new Date(
                shownMonth.getFullYear(),
                shownMonth.getMonth(),
                1,
            );
            const offset = (monthStart.getDay() + 6) % 7;
            const daysInMonth = new Date(
                shownMonth.getFullYear(),
                shownMonth.getMonth() + 1,
                0,
            ).getDate();
            const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
            const selectedIso = value.value;
            const cells = [];
            previous.disabled =
                shownMonth.getFullYear() === today.getFullYear() &&
                shownMonth.getMonth() <= today.getMonth();
            for (let index = 0; index < totalCells; index += 1) {
                const dayNumber = index - offset + 1;
                const cell = document.createElement("span");
                if (dayNumber < 1 || dayNumber > daysInMonth) {
                    cell.className = "date-picker-day is-empty";
                } else {
                    const date = new Date(
                        shownMonth.getFullYear(),
                        shownMonth.getMonth(),
                        dayNumber,
                    );
                    const iso = toIso(date);
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "date-picker-day";
                    button.textContent = String(dayNumber);
                    button.setAttribute("role", "gridcell");
                    button.setAttribute(
                        "aria-label",
                        new Intl.DateTimeFormat("vi-VN", {
                            dateStyle: "full",
                        }).format(date),
                    );
                    if (iso === selectedIso)
                        button.classList.add("is-selected");
                    if (iso === todayIso) button.classList.add("is-today");
                    if (iso < todayIso) button.disabled = true;
                    button.addEventListener("click", () => setDate(date));
                    cells.push(button);
                    continue;
                }
                cells.push(cell);
            }
            days.replaceChildren(...cells);
        }

        display.addEventListener("focus", open);
        display.addEventListener("input", parseDisplay);
        display.addEventListener("change", parseDisplay);
        toggle.addEventListener("click", () =>
            popover.hidden ? (display.focus(), open()) : close(),
        );
        previous.addEventListener("click", () => {
            shownMonth = new Date(
                shownMonth.getFullYear(),
                shownMonth.getMonth() - 1,
                1,
            );
            render();
        });
        next.addEventListener("click", () => {
            shownMonth = new Date(
                shownMonth.getFullYear(),
                shownMonth.getMonth() + 1,
                1,
            );
            render();
        });
        todayButton.addEventListener("click", () => setDate(today));
        picker.closest("form")?.addEventListener("reset", () =>
            setTimeout(() => {
                display.value = "";
                value.value = "";
                display.setCustomValidity("");
                shownMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                close();
            }, 0),
        );
        document.addEventListener("pointerdown", (event) => {
            if (!picker.contains(event.target)) close();
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && !popover.hidden) {
                event.stopImmediatePropagation();
                close();
                toggle.focus();
            }
        });
        window.addEventListener("resize", close);
        window.addEventListener(
            "scroll",
            () => {
                if (!popover.hidden) close();
            },
            true,
        );
        render();
    });
})();

/* --- customer-storefront.js --- */
(() => {
    const inventory = window.LandiformInventory;
    const grid = document.querySelector("#productGrid");
    if (!inventory || !grid) return;
    const requestedProjectCode =
        new URLSearchParams(window.location.search).get("project") || "";
    const catalog = inventory.all();
    const projects = Object.fromEntries(
        catalog.reduce((map, product) => {
            if (product.projectCode && !map.has(product.projectCode))
                map.set(product.projectCode, {
                    name: product.project,
                    area:
                        product.projectArea ||
                        product.address ||
                        "Đang cập nhật",
                    address: product.address || "",
                    type: product.projectType || product.type,
                });
            return map;
        }, new Map()),
    );
    const companyMarkup = document.querySelector("#customerCompanyProfile");
    const company = {
        fields: {
            displayName: companyMarkup?.dataset.name || "",
            phone: companyMarkup?.dataset.phone || "",
            email: companyMarkup?.dataset.email || "",
            website: companyMarkup?.dataset.website || "",
            address: companyMarkup?.dataset.address || "",
            taxCode: companyMarkup?.dataset.taxCode || "",
        },
        logo: companyMarkup?.dataset.logo || "",
    };
    const companyName =
        company.fields.displayName || "Doanh nghiệp bất động sản";
    const activeProjectCode = projects[requestedProjectCode]
        ? requestedProjectCode
        : "";
    const publicProducts = () =>
        catalog.filter(
            (item) =>
                item &&
                item.code &&
                item.status !== "Chờ duyệt" &&
                projects[item.projectCode] &&
                (!activeProjectCode || item.projectCode === activeProjectCode),
        );
    let products = publicProducts();
    let favorites = [];
    let favoritesOnly =
        new URLSearchParams(window.location.search).get("favorites") === "1";
    let selectedProduct = null;
    const toast = document.querySelector("#storeToast");
    const productModal = document.querySelector("#productModal");
    const appointmentModal = document.querySelector("#appointmentModal");
    const qrRegistrationModal = document.querySelector("#qrRegistrationModal");
    qrRegistrationModal?.addEventListener("click", (event) => {
        if (
            event.target === qrRegistrationModal ||
            event.target.closest("[data-qr-form-close]")
        )
            closeQrRegistration();
    });
    const projectFilter = document.querySelector("#projectFilter");
    const areaFilter = document.querySelector("#areaFilter");
    const typeFilter = document.querySelector("#typeFilter");
    const availabilityFilter = document.querySelector("#availabilityFilter");
    const productSearch = document.querySelector("#productSearch");
    const advancedFiltersToggle = document.querySelector(
        ".filter-advanced-toggle",
    );
    const filterCount = document.querySelector("#filterCount");

    function configureBrandAndPage() {
        document.querySelectorAll("[data-brand-name]").forEach((element) => {
            element.textContent = companyName;
        });
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
            element.href = phone
                ? `tel:${phone.replace(/[^+\d]/g, "")}`
                : "#contact";
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
        document
            .querySelectorAll("[data-company-address]")
            .forEach((element) => {
                element.textContent = address || "Đang cập nhật địa chỉ";
            });
        document
            .querySelectorAll("[data-company-address-wrap]")
            .forEach((element) => {
                element.hidden = !address;
            });
        const website = company.fields.website || "";
        const websiteUrl =
            website && /^https?:\/\//i.test(website)
                ? website
                : website
                  ? `https://${website}`
                  : "";
        document
            .querySelectorAll("[data-company-website]")
            .forEach((element) => {
                const text = element.querySelector(
                    "[data-company-website-text]",
                );
                if (text)
                    text.textContent = website
                        .replace(/^https?:\/\//i, "")
                        .replace(/\/$/, "");
                element.href = websiteUrl || "#contact";
                element.hidden = !website;
            });
        const companyMap = document.querySelector("[data-company-map]");
        const companyMapLink = document.querySelector(
            "[data-company-map-link]",
        );
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
            const mapQuery =
                project.address || `${project.name}, ${project.area}`;
            const encodedMapQuery = encodeURIComponent(mapQuery);
            document.querySelector("#projectLocationSection").hidden = false;
            document.querySelector("#projectLocationTitle").textContent =
                project.name;
            document.querySelector("#projectLocationAddress").textContent =
                project.address || project.area;
            const projectMapUrl = new URL("https://www.google.com/maps");
            projectMapUrl.searchParams.set("hl", "vi");
            projectMapUrl.searchParams.set("q", mapQuery);
            projectMapUrl.searchParams.set("z", project.address ? "16" : "12");
            projectMapUrl.searchParams.set("output", "embed");
            document.querySelector("#projectLocationMap").src =
                projectMapUrl.href;
            document.querySelector("#projectLocationLink").href =
                `https://www.google.com/maps/search/?api=1&query=${encodedMapQuery}`;
            projectFilter.value = activeProjectCode;
            title.replaceChildren(
                `Khám phá ${project.name}`,
                document.createElement("br"),
            );
            const tagline = document.createElement("em");
            tagline.textContent = "chọn nơi an cư phù hợp.";
            title.append(tagline);
            description.textContent = `Tìm hiểu thông tin dự án ${project.name} tại ${project.area}. Xem từng sản phẩm đang được giới thiệu và đặt lịch trao đổi cùng chuyên viên ${companyName}.`;
            productHeading.textContent = `Sản phẩm tại ${project.name}`;
            document.querySelector("#projectFilter").hidden = true;
            document.querySelector("#heroProject").closest("div").hidden = true;
            document.querySelector(".hero-kicker").lastChild.textContent =
                ` · ${project.name.toLocaleUpperCase("vi")}`;
            document.title = `${project.name} | ${companyName}`;
        } else {
            document.title = `Dự án & sản phẩm | ${companyName}`;
        }
        const descriptionMeta = document.querySelector(
            'meta[name="description"]',
        );
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDescription = document.querySelector(
            'meta[property="og:description"]',
        );
        if (descriptionMeta)
            descriptionMeta.content = project
                ? `Thông tin dự án ${project.name} tại ${project.area}. Xem sản phẩm và đăng ký lịch tư vấn với ${companyName}.`
                : `Khám phá dự án, căn hộ, nhà phố và đất nền của ${companyName}. Xem thông tin sản phẩm và đăng ký lịch tư vấn.`;
        if (ogTitle) ogTitle.content = document.title;
        if (ogDescription)
            ogDescription.content = descriptionMeta?.content || "";
    }

    function notify(message) {
        window.LandiformCustomerUI.notify(toast, message);
    }
    function formatPrice(value) {
        return window.LandiformCustomerUI.formatPrice(value);
    }
    function projectName(product) {
        return (
            projects[product.projectCode]?.name || product.project || "Dự án"
        );
    }
    function locationName(product) {
        const project = projects[product.projectCode];
        const location =
            product.address?.trim() ||
            project?.address?.trim() ||
            project?.area ||
            "Đang cập nhật khu vực";
        const sector = product.tower
            ? `${product.tower}${product.floor != null ? ` · Tầng ${product.floor}` : ""}`
            : "";
        return sector ? `${location} · ${sector}` : location;
    }
    function imageFor(product) {
        return product.image || "";
    }
    function statusText(status) {
        return (
            {
                "Còn bán": "Đang mở bán",
                "Đang giữ chỗ": "Đang giữ chỗ",
                "Chờ duyệt": "Đang có yêu cầu",
                "Đã bán": "Đã giao dịch",
                "Chưa mở bán": "Sắp mở bán",
            }[status] || status
        );
    }
    function statusClass(status) {
        return (
            {
                "Còn bán": "",
                "Đang giữ chỗ": "reserved",
                "Chờ duyệt": "pending",
                "Đã bán": "sold",
                "Chưa mở bán": "soon",
            }[status] || ""
        );
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
    function productAttributeFacts(product) {
        const attributes = { ...(product.attributes || {}) };
        const bedroomMatch = /(\d+)\s*phòng ngủ/i.exec(product.type || "");
        if (attributes.bedrooms == null && bedroomMatch)
            attributes.bedrooms = Number(bedroomMatch[1]);
        const labels = {
            bedrooms: "Phòng ngủ",
            bathrooms: "Phòng tắm",
            storeys: "Số tầng xây dựng",
            frontage: "Mặt tiền (m)",
            depth: "Chiều sâu (m)",
            landUse: "Pháp lý",
            usage: "Mục đích sử dụng",
        };
        return Object.entries(attributes)
            .filter(
                ([key, value]) => value !== "" && value != null && labels[key],
            )
            .map(([key, value]) => [labels[key], value]);
    }
    function filteredProducts() {
        const query = productSearch.value.trim().toLocaleLowerCase("vi");
        const project = projectFilter.value;
        const area = areaFilter.value;
        const type = typeFilter.value;
        const availability = availabilityFilter.value;
        const minPrice = Number(document.querySelector("#minPrice").value || 0);
        const maxPrice = Number(
            document.querySelector("#maxPrice").value || Infinity,
        );
        const minArea = Number(document.querySelector("#minArea").value || 0);
        const maxArea = Number(
            document.querySelector("#maxArea").value || Infinity,
        );
        const bedrooms = document.querySelector("#bedroomFilter").value;
        const result = products.filter((product) => {
            const searchable =
                `${product.code} ${product.type} ${productNameText(product)} ${projectName(product)} ${locationName(product)}`.toLocaleLowerCase(
                    "vi",
                );
            const projectArea = projects[product.projectCode]?.area || "";
            const bedroomMatch = /(\d+)\s*phòng ngủ/i.exec(product.type || "");
            const bedroomCount =
                product.attributes?.bedrooms != null
                    ? Number(product.attributes.bedrooms)
                    : bedroomMatch
                      ? Number(bedroomMatch[1])
                      : null;
            const matchesBedrooms =
                !bedrooms ||
                (bedrooms === "studio"
                    ? /studio/i.test(product.type || "")
                    : bedrooms === "4"
                      ? bedroomCount >= 4
                      : bedroomCount === Number(bedrooms));
            return (
                (!query || searchable.includes(query)) &&
                (!project || product.projectCode === project) &&
                (!area || projectArea === area) &&
                (!type || product.type === type) &&
                (availability === "all" ||
                    (availability === "available"
                        ? product.status === "Còn bán"
                        : product.status === availability)) &&
                Number(product.price) >= minPrice &&
                Number(product.price) <= maxPrice &&
                Number(product.area) >= minArea &&
                Number(product.area) <= maxArea &&
                matchesBedrooms &&
                (!favoritesOnly || favorites.includes(product.id))
            );
        });
        const sort = document.querySelector("#sortFilter").value;
        if (sort === "price-asc")
            result.sort((a, b) => Number(a.price) - Number(b.price));
        if (sort === "price-desc")
            result.sort((a, b) => Number(b.price) - Number(a.price));
        if (sort === "area-asc")
            result.sort((a, b) => Number(a.area) - Number(b.area));
        if (sort === "area-desc")
            result.sort((a, b) => Number(b.area) - Number(a.area));
        return result;
    }
    function productNameText(product) {
        return `${product.tower || ""} ${product.floor == null ? "" : `tầng ${product.floor}`} ${product.number || ""}`;
    }
    function renderProducts() {
        const result = filteredProducts();
        const byId = new Map(
            [...grid.querySelectorAll(".product-card[data-product-id]")].map(
                (card) => [card.dataset.productId, card],
            ),
        );
        const visible = new Set(result.map((product) => product.id));
        byId.forEach((card, id) => {
            card.hidden = !visible.has(id);
            const favorite = card.querySelector("[data-favorite]");
            if (favorite) {
                favorite.classList.toggle(
                    "is-favorite",
                    favorites.includes(id),
                );
                favorite.setAttribute(
                    "aria-label",
                    favorites.includes(id) ? "Bỏ lưu sản phẩm" : "Lưu sản phẩm",
                );
            }
        });
        result.forEach((product) => {
            const card = byId.get(product.id);
            if (card) grid.append(card);
        });
        document.querySelector("#showFavorites span").textContent =
            favoritesOnly ? "Tất cả" : "Đã lưu";
        document.querySelector("#emptyProducts").hidden = result.length > 0;
        document.querySelector("#resultSummary").textContent = favoritesOnly
            ? `${result.length} sản phẩm bạn đã lưu`
            : `${result.length} sản phẩm phù hợp${projectFilter.value ? ` tại ${projectName({ projectCode: projectFilter.value })}` : " với lựa chọn của bạn"}`;
        document.querySelector("#favoriteCount").textContent = String(
            favorites.length,
        );
        updateFilterCount();
        window.CustomerSelects?.syncAll();
    }
    function updateFilterCount() {
        const activeCount = [
            productSearch.value.trim(),
            areaFilter.value,
            typeFilter.value,
            projectFilter.value && projectFilter.value !== activeProjectCode
                ? projectFilter.value
                : "",
            availabilityFilter.value !== "available"
                ? availabilityFilter.value
                : "",
            document.querySelector("#minPrice").value,
            document.querySelector("#maxPrice").value,
            document.querySelector("#minArea").value,
            document.querySelector("#maxArea").value,
            document.querySelector("#bedroomFilter").value,
            document.querySelector("#sortFilter").value !== "featured"
                ? document.querySelector("#sortFilter").value
                : "",
        ].filter(Boolean).length;
        filterCount.textContent = String(activeCount);
        filterCount.hidden = activeCount === 0;
        advancedFiltersToggle.classList.toggle(
            "has-active-filters",
            activeCount > 0,
        );
    }
    function saveFavorites() {
        renderProducts();
    }
    function toggleFavorite(id) {
        favorites = favorites.includes(id)
            ? favorites.filter((item) => item !== id)
            : [...favorites, id];
        saveFavorites();
        if (selectedProduct?.id === id) updateDetailFavorite();
        notify(
            favorites.includes(id)
                ? "Đã lưu sản phẩm vào danh sách quan tâm."
                : "Đã bỏ sản phẩm khỏi danh sách đã lưu.",
        );
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
        document.querySelector("#detailProject").textContent =
            projectName(product);
        document.querySelector("#detailTitle").textContent =
            `${productTitle(product)} · ${product.code}`;
        document.querySelector("#detailLocation").textContent =
            locationName(product);
        document.querySelector("#detailPrice").textContent = formatPrice(
            product.price,
        );
        const facts = document.querySelector("#detailFacts");
        facts.replaceChildren();
        const details = [
            ["Mã sản phẩm", product.code],
            ["Loại hình", product.type],
            ["Diện tích", `${product.area} m²`],
            [
                product.floor != null ? "Vị trí" : "Phân khu",
                product.floor != null
                    ? `${product.tower} · Tầng ${product.floor}`
                    : product.tower || "Đang cập nhật",
            ],
            ...productAttributeFacts(product),
            ["Tình trạng", statusText(product.status)],
            ["Dự án", projectName(product)],
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
        window.CustomerBranches?.setForArea(
            form.elements.branchId,
            product ? projects[product.projectCode]?.area || "" : "",
        );
        const selectedBox = document.querySelector(
            "#appointmentSelectedProduct",
        );
        selectedBox.hidden = !product;
        selectedBox.textContent = product
            ? `Sản phẩm quan tâm: ${product.code} · ${productTitle(product)} · ${projectName(product)}`
            : "";
        document.querySelector("#appointmentModal").hidden = false;
        document.body.classList.add("store-modal-open");
        form.elements.name.focus();
    }
    function formConfiguration(formId) {
        const element = document.querySelector(
            `#publicFormExamples [data-id="${CSS.escape(formId)}"]`,
        );
        if (!element) return null;
        const record = { ...element.dataset };
        ["email", "need", "budget", "appointment", "qr"].forEach((key) => {
            record[key] = record[key] === "true";
        });
        return record;
    }
    function openQrRegistration(formId) {
        const config = formConfiguration(formId);
        if (!config || !config.qr || config.status !== "Đang nhận") {
            notify(
                "Biểu mẫu QR không tồn tại hoặc đang tạm dừng. Vui lòng liên hệ đơn vị tư vấn.",
            );
            return;
        }
        const projectCode =
            new URLSearchParams(window.location.search).get("project") ||
            config.projectCode ||
            "";
        const project = projects[projectCode];
        if (config.projectCode && projectCode !== config.projectCode) {
            notify("Mã QR này không thuộc dự án đang mở.");
            return;
        }
        if (!qrRegistrationModal) return;
        const modalForm = qrRegistrationModal.querySelector(
            "#qrRegistrationForm",
        );
        ["email", "need", "budget", "appointment"].forEach((field) => {
            const wrapper = modalForm.querySelector(
                `[data-qr-field="${field}"]`,
            );
            const enabled = Boolean(config[field]);
            wrapper.hidden = !enabled;
            wrapper
                .querySelectorAll("input, textarea, select")
                .forEach((input) => {
                    input.disabled = !enabled;
                });
        });
        const date = modalForm.elements.date;
        const today = new Date();
        date.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        qrRegistrationModal.querySelector("#qrRegistrationTitle").textContent =
            config.name;
        qrRegistrationModal.querySelector("#qrRegistrationIntro").textContent =
            "Để lại thông tin, đội ngũ tư vấn sẽ liên hệ với bạn.";
        qrRegistrationModal.querySelector(
            "#qrRegistrationProject",
        ).textContent = `Dự án quan tâm: ${project?.name || config.project}`;
        qrRegistrationModal.hidden = false;
        document.body.classList.add("store-modal-open");
        modalForm.elements.name.focus();
    }
    function closeQrRegistration() {
        if (!qrRegistrationModal) return;
        qrRegistrationModal.hidden = true;
        if (productModal.hidden && appointmentModal.hidden)
            document.body.classList.remove("store-modal-open");
    }
    function closeModal(modal) {
        modal.hidden = true;
        if (productModal.hidden && appointmentModal.hidden)
            document.body.classList.remove("store-modal-open");
    }

    configureBrandAndPage();
    document
        .querySelector("#activateProjectMap")
        ?.addEventListener("click", (event) => {
            event.currentTarget.hidden = true;
            document.querySelector("#projectLocationMap")?.focus();
        });
    syncProjectOptions();
    if (favoritesOnly) availabilityFilter.value = "all";
    renderProducts();
    document
        .querySelector("#heroSearchForm")
        .addEventListener("submit", (event) => {
            event.preventDefault();
            productSearch.value = document.querySelector("#heroKeyword").value;
            if (!activeProjectCode)
                projectFilter.value =
                    document.querySelector("#heroProject").value;
            typeFilter.value = document.querySelector("#heroType").value;
            favoritesOnly = false;
            renderProducts();
            document
                .querySelector("#products")
                .scrollIntoView({ behavior: "smooth" });
        });
    [
        productSearch,
        projectFilter,
        areaFilter,
        typeFilter,
        availabilityFilter,
        document.querySelector("#minPrice"),
        document.querySelector("#maxPrice"),
        document.querySelector("#minArea"),
        document.querySelector("#maxArea"),
        document.querySelector("#bedroomFilter"),
        document.querySelector("#sortFilter"),
    ].forEach((control) => {
        control.addEventListener(
            control.tagName === "INPUT" ? "input" : "change",
            () => {
                favoritesOnly = false;
                renderProducts();
            },
        );
    });

    document
        .querySelector("#clearFilters")
        .addEventListener("click", clearFilters);
    document
        .querySelector("#emptyReset")
        .addEventListener("click", clearFilters);
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
    document
        .querySelector("#showFavorites")
        .addEventListener("click", (event) => {
            event.preventDefault();
            favoritesOnly = !favoritesOnly;
            if (favoritesOnly) availabilityFilter.value = "all";
            document.querySelector("#showFavorites span").textContent =
                favoritesOnly ? "Tất cả" : "Đã lưu";
            renderProducts();
            document
                .querySelector("#products")
                .scrollIntoView({ behavior: "smooth" });
            if (favoritesOnly && !favorites.length)
                notify(
                    "Bạn chưa lưu sản phẩm nào. Chọn biểu tượng trái tim trên sản phẩm để lưu.",
                );
        });
    document.querySelectorAll("[data-layout]").forEach((button) =>
        button.addEventListener("click", () => {
            document
                .querySelectorAll("[data-layout]")
                .forEach((item) =>
                    item.classList.toggle("is-active", item === button),
                );
            grid.classList.toggle(
                "list-layout",
                button.dataset.layout === "list",
            );
        }),
    );
    grid.addEventListener("click", (event) => {
        const favorite = event.target.closest("[data-favorite]");
        if (favorite) {
            toggleFavorite(favorite.dataset.favorite);
            return;
        }
        const details = event.target.closest("[data-product-detail]");
        if (details) {
            openProduct(details.dataset.productDetail);
            return;
        }
        const appointment = event.target.closest("[data-product-appointment]");
        if (appointment)
            openAppointment(
                products.find(
                    (item) =>
                        item.id === appointment.dataset.productAppointment,
                ),
            );
    });
    document.querySelector("#detailFavorite").addEventListener("click", () => {
        if (selectedProduct) toggleFavorite(selectedProduct.id);
    });
    document
        .querySelector("#detailAppointment")
        .addEventListener("click", () => {
            const product = selectedProduct;
            closeModal(productModal);
            openAppointment(product);
        });
    document.querySelectorAll("[data-open-appointment]").forEach((button) =>
        button.addEventListener("click", (event) => {
            event.preventDefault();
            openAppointment();
        }),
    );
    document.querySelectorAll("[data-close-modal]").forEach((button) =>
        button.addEventListener("click", () => {
            const modal = button.closest(".store-modal-backdrop");
            if (modal) closeModal(modal);
        }),
    );
    [productModal, appointmentModal].forEach((modal) =>
        modal.addEventListener("click", (event) => {
            if (event.target === modal) closeModal(modal);
        }),
    );
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape")
            [productModal, appointmentModal, qrRegistrationModal]
                .filter(Boolean)
                .forEach((modal) => {
                    if (!modal.hidden)
                        modal === qrRegistrationModal
                            ? closeQrRegistration()
                            : closeModal(modal);
                });
    });

    const appointmentForm = document.querySelector("#appointmentRequestForm");
    const appointmentDate = appointmentForm.elements.date;
    const now = new Date();
    appointmentDate.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    document.addEventListener("landiform:inventory-updated", () => {
        products = publicProducts();
        syncProjectOptions();
        renderProducts();
    });
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get("form")) openQrRegistration(queryParams.get("form"));
    else if (queryParams.get("appointment") === "1") openAppointment();
})();

/* --- customer-detail.js --- */
(() => {
    if (document.body.dataset.customerPage !== "detail") return;
    const inventory = window.LandiformInventory;
    if (!inventory) return;
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");
    const catalog = inventory.all();
    const projects = Object.fromEntries(
        catalog.reduce((map, item) => {
            if (item.projectCode && !map.has(item.projectCode))
                map.set(item.projectCode, {
                    name: item.project,
                    area: item.projectArea || item.address || "Đang cập nhật",
                    address: item.address || "",
                    type: item.projectType || item.type,
                });
            return map;
        }, new Map()),
    );
    const companyMarkup = document.querySelector("#customerCompanyProfile");
    const company = {
        fields: {
            displayName: companyMarkup?.dataset.name || "",
            phone: companyMarkup?.dataset.phone || "",
            email: companyMarkup?.dataset.email || "",
            taxCode: companyMarkup?.dataset.taxCode || "",
        },
        logo: companyMarkup?.dataset.logo || "",
    };
    const companyName =
        company.fields.displayName || "Doanh nghiệp bất động sản";
    const product = catalog.find(
        (item) =>
            item?.id === productId &&
            item.code &&
            item.status !== "Chờ duyệt" &&
            projects[item.projectCode],
    );
    const modal = document.querySelector("#appointmentModal");
    const form = document.querySelector("#appointmentRequestForm");
    const toast = document.querySelector("#detailToast");
    let galleryImages = [];
    let activeImageIndex = 0;
    let favorites = [];
    let viewerZoom = 1;
    let viewerPan = { x: 0, y: 0 };
    let panPointer = null;

    function notify(message) {
        window.LandiformCustomerUI.notify(toast, message);
    }
    function formatPrice(value) {
        return window.LandiformCustomerUI.formatPrice(value);
    }
    function projectName(item) {
        return projects[item.projectCode]?.name || item.project || "Dự án";
    }
    function productTitle(item) {
        return `${item.type || "Sản phẩm"} · ${item.code}`;
    }
    function propertyTypeIcon(type = "") {
        if (/đất|lô/i.test(type)) return "fa-map-location-dot";
        if (/nghỉ dưỡng|resort/i.test(type)) return "fa-umbrella-beach";
        if (/thương mại|văn phòng/i.test(type)) return "fa-briefcase";
        if (/đô thị/i.test(type)) return "fa-city";
        if (/nhà|biệt thự|villa/i.test(type)) return "fa-house";
        return "fa-building";
    }
    function imageFor(item) {
        return item.galleryImages?.[0] || item.image || "";
    }
    function galleryImagesFor(item) {
        return item.galleryImages?.length
            ? item.galleryImages
            : [imageFor(item)];
    }
    function renderGallery() {
        const image = document.querySelector("#detailPageImage");
        image.src = galleryImages[activeImageIndex];
        image.alt = `Ảnh minh họa ${activeImageIndex + 1} của ${productTitle(product)} tại ${projectName(product)}`;
        document.querySelector("#galleryCounter").textContent =
            `${activeImageIndex + 1} / ${galleryImages.length}`;
        const thumbnails = document.querySelector("#detailGalleryThumbnails");
        thumbnails.replaceChildren(
            ...galleryImages.map((src, index) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = `gallery-thumbnail${index === activeImageIndex ? " is-active" : ""}`;
                button.setAttribute("aria-label", `Xem ảnh ${index + 1}`);
                button.setAttribute(
                    "aria-pressed",
                    String(index === activeImageIndex),
                );
                const thumbnail = document.createElement("img");
                thumbnail.src = src;
                thumbnail.alt = "";
                thumbnail.loading = "lazy";
                button.append(thumbnail);
                button.addEventListener("click", () => {
                    activeImageIndex = index;
                    viewerZoom = 1;
                    viewerPan = { x: 0, y: 0 };
                    renderGallery();
                });
                return button;
            }),
        );
        renderViewer();
    }
    function renderViewer(updateThumbnails = true, updateImage = true) {
        if (!product || !galleryImages.length) return;
        const image = document.querySelector("#viewerImage");
        if (updateImage) {
            image.src = galleryImages[activeImageIndex];
            image.alt = `Ảnh minh họa ${activeImageIndex + 1} của ${productTitle(product)} tại ${projectName(product)}`;
            document.querySelector("#viewerImageTitle").textContent =
                `${product.type} · ${product.code}`;
        }
        image.style.transform = `translate(${viewerPan.x}px, ${viewerPan.y}px) scale(${viewerZoom})`;
        document.querySelector("#viewerImageCounter").textContent =
            `${activeImageIndex + 1} / ${galleryImages.length}`;
        document.querySelector("#viewerZoomLevel").textContent =
            `${Math.round(viewerZoom * 100)}%`;
        document.querySelector("#viewerZoomOut").disabled = viewerZoom <= 1;
        document.querySelector("#viewerZoomIn").disabled = viewerZoom >= 3;
        if (updateThumbnails) {
            const thumbnails = document.querySelector("#viewerThumbnails");
            thumbnails.replaceChildren(
                ...galleryImages.map((src, index) => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = `gallery-thumbnail${index === activeImageIndex ? " is-active" : ""}`;
                    button.setAttribute("aria-label", `Xem ảnh ${index + 1}`);
                    button.setAttribute(
                        "aria-pressed",
                        String(index === activeImageIndex),
                    );
                    const thumbnail = document.createElement("img");
                    thumbnail.src = src;
                    thumbnail.alt = "";
                    thumbnail.loading = "lazy";
                    button.append(thumbnail);
                    button.addEventListener("click", () => {
                        activeImageIndex = index;
                        viewerZoom = 1;
                        viewerPan = { x: 0, y: 0 };
                        renderGallery();
                    });
                    return button;
                }),
            );
        }
    }
    function stepGallery(direction) {
        if (!galleryImages.length) return;
        activeImageIndex =
            (activeImageIndex + direction + galleryImages.length) %
            galleryImages.length;
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
        return [...favorites];
    }
    function setBrand() {
        document.querySelectorAll("[data-brand-name]").forEach((element) => {
            element.textContent = companyName;
        });
        document.querySelectorAll("[data-brand-mark]").forEach((mark) => {
            const logo = mark.querySelector("[data-brand-logo]");
            if (company.logo && logo) {
                logo.src = company.logo;
                logo.hidden = false;
                mark.querySelector("i")?.setAttribute("hidden", "");
            }
        });
        document.querySelectorAll("[data-company-phone]").forEach((link) => {
            const phone = company.fields.phone || "";
            link.href = phone
                ? `tel:${phone.replace(/[^+\d]/g, "")}`
                : "#contact";
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
        status.textContent =
            {
                "Còn bán": "Đang mở bán",
                "Đang giữ chỗ": "Đang giữ chỗ",
                "Chờ duyệt": "Đang có yêu cầu",
                "Đã bán": "Đã giao dịch",
                "Chưa mở bán": "Sắp mở bán",
            }[product.status] || product.status;
        document.querySelector("#detailPageProject").textContent =
            projectName(product);
        document.querySelector("#detailPageTitle").textContent =
            productTitle(product);
        const location = document.querySelector("#detailPageLocation");
        const locationIcon = document.createElement("i");
        locationIcon.className = "fa-solid fa-location-dot";
        locationIcon.setAttribute("aria-hidden", "true");
        const productAddress =
            product.address?.trim() || project.address?.trim() || project.area;
        location.replaceChildren(
            locationIcon,
            document.createTextNode(
                ` ${productAddress}${product.tower ? ` · ${product.tower}${product.floor != null ? ` · Tầng ${product.floor}` : ""}` : ""}`,
            ),
        );
        document.querySelector("#detailPagePrice").textContent = formatPrice(
            product.price,
        );
        document.querySelector("#breadcrumbProduct").textContent = product.code;
        document.querySelector("#projectBreadcrumb").textContent =
            projectName(product);
        document.querySelector("#projectBreadcrumb").href =
            `index.html${projectQuery}#products`;
        document.querySelector("#projectNavLink").href =
            `index.html${projectQuery}#products`;
        document.querySelector("#viewProjectLink").href =
            `index.html${projectQuery}#products`;
        document.querySelector("#detailProjectDescription").textContent =
            `Tìm hiểu thêm các sản phẩm thuộc ${projectName(product)} tại ${project.area}. Đội ngũ ${companyName} có thể hỗ trợ thông tin về vị trí, tình trạng và chính sách bán hàng.`;
        const mapQuery =
            product.address?.trim() ||
            project.address?.trim() ||
            `${projectName(product)}, ${project.area}`;
        const encodedMapQuery = encodeURIComponent(mapQuery);
        document.querySelector("#detailMapAddress").textContent =
            product.address?.trim() || project.address?.trim() || project.area;
        document.querySelector("#detailProjectMap").src =
            `https://www.google.com/maps?q=${encodedMapQuery}&output=embed`;
        document.querySelector("#detailMapLink").href =
            `https://www.google.com/maps/search/?api=1&query=${encodedMapQuery}`;
        document.title = `${productTitle(product)} | ${projectName(product)} | ${companyName}`;
        const facts = [
            ["Mã sản phẩm", product.code, "fa-hashtag"],
            [
                "Loại hình",
                product.type || "Đang cập nhật",
                propertyTypeIcon(product.type),
            ],
            [
                "Diện tích",
                product.area ? `${product.area} m²` : "Đang cập nhật",
                "fa-ruler-combined",
            ],
            [
                product.floor != null ? "Tầng / tháp" : "Phân khu",
                product.floor != null
                    ? `${product.tower || ""} · Tầng ${product.floor}`
                    : product.tower || "Đang cập nhật",
                product.floor != null ? "fa-building" : "fa-map-location-dot",
            ],
        ];
        const attributeIcons = {
            bedrooms: "fa-bed",
            bathrooms: "fa-bath",
            storeys: "fa-building",
            frontage: "fa-ruler-horizontal",
            depth: "fa-ruler-vertical",
            landUse: "fa-file-circle-check",
            usage: "fa-store",
        };
        const attributeLabels = {
            bedrooms: "Phòng ngủ",
            bathrooms: "Phòng tắm",
            storeys: "Số tầng xây dựng",
            frontage: "Mặt tiền (m)",
            depth: "Chiều sâu (m)",
            landUse: "Mục đích sử dụng / pháp lý",
            usage: "Mục đích sử dụng",
        };
        const attributes = { ...(product.attributes || {}) };
        const bedroomMatch = /(\d+)\s*phòng ngủ/i.exec(product.type || "");
        if (attributes.bedrooms == null && bedroomMatch)
            attributes.bedrooms = Number(bedroomMatch[1]);
        Object.entries(attributes).forEach(([key, value]) => {
            if (value !== "" && value != null && attributeLabels[key])
                facts.push([attributeLabels[key], value, attributeIcons[key]]);
        });
        const factsContainer = document.querySelector("#detailPageFacts");
        factsContainer.replaceChildren(
            ...facts.map(([label, value, icon]) => {
                const item = document.createElement("article");
                item.className = "detail-page-fact";
                item.innerHTML = `<span><i class="fa-solid ${icon}" aria-hidden="true"></i></span><div><small>${label}</small><strong></strong></div>`;
                item.querySelector("strong").textContent = value;
                return item;
            }),
        );
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
        window.CustomerBranches?.setForArea(
            form.elements.branchId,
            projects[product.projectCode]?.area || "",
        );
        document.querySelector("#appointmentModeLabel").textContent = isViewing
            ? "ĐẶT LỊCH XEM"
            : "TƯ VẤN SẢN PHẨM";
        document.querySelector("#appointmentTitle").textContent = isViewing
            ? "Đặt lịch xem sản phẩm"
            : "Nhờ chuyên viên tư vấn";
        document.querySelector("#appointmentIntro").textContent = isViewing
            ? "Chọn ngày và khung giờ mong muốn để chuyên viên xác nhận lịch xem."
            : "Để lại thông tin liên hệ. Chuyên viên sẽ gọi lại để giải đáp về sản phẩm, giá và chính sách.";
        const modeIcon = document.querySelector("#appointmentModeIcon");
        modeIcon.outerHTML = isViewing
            ? '<svg id="appointmentModeIcon" class="calendar-action-icon" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8.5 15l2 2 5-5"/></svg>'
            : '<i id="appointmentModeIcon" class="fa-solid fa-headset" aria-hidden="true"></i>';
        document.querySelector("#appointmentScheduleFields").hidden =
            !isViewing;
        form.elements.date.required = false;
        form.elements.dateDisplay.required = isViewing;
        form.elements.time.required = isViewing;
        document.querySelector("#appointmentSubmitButton").innerHTML = isViewing
            ? 'Xác nhận đặt lịch <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>'
            : 'Gửi yêu cầu tư vấn <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
        document.querySelector("#appointmentSelectedProduct").textContent =
            product
                ? `Sản phẩm quan tâm: ${product.code} · ${product.type} · ${projectName(product)}`
                : "";
        modal.hidden = false;
        document.body.classList.add("store-modal-open");
        form.elements.name.focus();
    }
    function closeAppointment() {
        modal.hidden = true;
        document.body.classList.remove("store-modal-open");
    }

    renderProduct();
    document.querySelector("#currentYear").textContent = String(
        new Date().getFullYear(),
    );
    document
        .querySelector("#detailPageFavorite")
        .addEventListener("click", () => {
            if (!product) return;
            const currentFavorites = readFavorites();
            const updated = currentFavorites.includes(product.id)
                ? currentFavorites.filter((id) => id !== product.id)
                : [...currentFavorites, product.id];
            favorites.splice(0, favorites.length, ...updated);
            updateFavoriteButton();
            notify(
                updated.includes(product.id)
                    ? "Đã lưu sản phẩm vào danh sách quan tâm."
                    : "Đã bỏ sản phẩm khỏi danh sách đã lưu.",
            );
        });
    document
        .querySelector("#galleryPrevious")
        .addEventListener("click", () => stepGallery(-1));
    document
        .querySelector("#galleryNext")
        .addEventListener("click", () => stepGallery(1));
    document
        .querySelector("#viewerPrevious")
        .addEventListener("click", () => stepGallery(-1));
    document
        .querySelector("#viewerNext")
        .addEventListener("click", () => stepGallery(1));
    document
        .querySelector("#openImageViewer")
        .addEventListener("click", openImageViewer);
    document
        .querySelector("#closeImageViewer")
        .addEventListener("click", closeImageViewer);
    document
        .querySelector("#imageViewer")
        .addEventListener("click", (event) => {
            if (event.target.id === "imageViewer") closeImageViewer();
        });
    document.querySelector("#viewerZoomOut").addEventListener("click", () => {
        viewerZoom = Math.max(1, Number((viewerZoom - 0.25).toFixed(2)));
        if (viewerZoom === 1) viewerPan = { x: 0, y: 0 };
        renderViewer(false, false);
    });
    document.querySelector("#viewerZoomIn").addEventListener("click", () => {
        viewerZoom = Math.min(3, Number((viewerZoom + 0.25).toFixed(2)));
        renderViewer(false, false);
    });
    document.querySelector("#imageViewerStage").addEventListener(
        "wheel",
        (event) => {
            if (document.querySelector("#imageViewer").hidden) return;
            event.preventDefault();
            viewerZoom =
                event.deltaY < 0
                    ? Math.min(3, viewerZoom + 0.2)
                    : Math.max(1, viewerZoom - 0.2);
            if (viewerZoom === 1) viewerPan = { x: 0, y: 0 };
            renderViewer(false, false);
        },
        { passive: false },
    );
    const viewerStage = document.querySelector("#imageViewerStage");
    viewerStage.addEventListener("pointerdown", (event) => {
        if (viewerZoom <= 1) return;
        panPointer = {
            id: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            panX: viewerPan.x,
            panY: viewerPan.y,
        };
        viewerStage.setPointerCapture(event.pointerId);
        viewerStage.classList.add("is-panning");
    });
    viewerStage.addEventListener("pointermove", (event) => {
        if (!panPointer || panPointer.id !== event.pointerId) return;
        viewerPan = {
            x: panPointer.panX + event.clientX - panPointer.startX,
            y: panPointer.panY + event.clientY - panPointer.startY,
        };
        renderViewer(false, false);
    });
    const stopPanning = () => {
        panPointer = null;
        viewerStage.classList.remove("is-panning");
    };
    viewerStage.addEventListener("pointerup", stopPanning);
    viewerStage.addEventListener("pointercancel", stopPanning);
    document.addEventListener("keydown", (event) => {
        if (document.querySelector("#imageViewer").hidden) return;
        if (event.key === "Escape") closeImageViewer();
        if (event.key === "ArrowLeft") stepGallery(-1);
        if (event.key === "ArrowRight") stepGallery(1);
        if (event.key === "+" || event.key === "=") {
            viewerZoom = Math.min(3, viewerZoom + 0.25);
            renderViewer(false, false);
        }
        if (event.key === "-") {
            viewerZoom = Math.max(1, viewerZoom - 0.25);
            if (viewerZoom === 1) viewerPan = { x: 0, y: 0 };
            renderViewer(false, false);
        }
    });
    document.querySelectorAll("[data-open-appointment]").forEach((button) =>
        button.addEventListener("click", (event) => {
            event.preventDefault();
            openAppointment(button.dataset.openAppointment || "viewing");
        }),
    );
    document
        .querySelectorAll("[data-close-modal]")
        .forEach((button) =>
            button.addEventListener("click", closeAppointment),
        );
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeAppointment();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) closeAppointment();
    });
    const now = new Date();
    form.elements.date.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
})();

/* --- customer-selects.js --- */
(() => {
    const selects = document.querySelectorAll("select");
    if (!selects.length) return;

    const controls = new Map();
    const chevron =
        '<svg class="customer-select-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>';
    const clockIcon =
        '<svg class="customer-select-clock-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

    function getLabel(select) {
        if (select.getAttribute("aria-label"))
            return select.getAttribute("aria-label");
        const label = select.labels?.[0];
        if (!label) return "Chọn một mục";
        const clone = label.cloneNode(true);
        clone
            .querySelectorAll("select, input, textarea, button")
            .forEach((item) => item.remove());
        return clone.textContent.trim() || "Chọn một mục";
    }

    function closeAll(except = null) {
        controls.forEach((control) => {
            if (control !== except) control.close(false);
        });
    }

    function enhance(select) {
        if (
            controls.has(select) ||
            select.multiple ||
            select.hidden ||
            select.dataset.nativeSelect === "true"
        )
            return;
        const wrapper = document.createElement("div");
        wrapper.className = "customer-select";
        const trigger = document.createElement("button");
        trigger.className = "customer-select-trigger";
        trigger.type = "button";
        trigger.setAttribute("role", "combobox");
        trigger.setAttribute("aria-haspopup", "listbox");
        trigger.setAttribute("aria-expanded", "false");
        trigger.setAttribute("aria-label", getLabel(select));
        if (select.required) trigger.setAttribute("aria-required", "true");
        const value = document.createElement("span");
        value.className = "customer-select-value";
        const arrow = document.createElement("span");
        arrow.className = "customer-select-arrow";
        arrow.innerHTML = chevron;
        if (select.name === "time") {
            const icon = document.createElement("span");
            icon.className = "customer-select-time-icon";
            icon.innerHTML = clockIcon;
            trigger.append(icon, value, arrow);
        } else trigger.append(value, arrow);

        const menu = document.createElement("div");
        menu.className = "customer-select-menu";
        menu.id = `${select.id || `customer-select-${controls.size}`}-options`;
        menu.setAttribute("role", "listbox");
        trigger.setAttribute("aria-controls", menu.id);

        select.parentNode.insertBefore(wrapper, select);
        wrapper.append(select, trigger, menu);
        select.classList.add("customer-select-native");
        select.setAttribute("aria-hidden", "true");
        select.tabIndex = -1;

        const control = {
            select,
            wrapper,
            trigger,
            menu,
            value,
            activeIndex: -1,
            close(returnFocus = false) {
                wrapper.classList.remove("is-open");
                trigger.setAttribute("aria-expanded", "false");
                if (returnFocus) trigger.focus();
            },
            sync() {
                const selected = select.options[select.selectedIndex];
                value.textContent = selected?.textContent || "Chọn một mục";
                trigger.disabled = select.disabled;
                menu.replaceChildren(
                    ...Array.from(select.options, (option, index) => {
                        const item = document.createElement("button");
                        item.type = "button";
                        item.className = "customer-select-option";
                        item.setAttribute("role", "option");
                        item.setAttribute(
                            "aria-selected",
                            String(option.selected),
                        );
                        item.disabled = option.disabled;
                        item.tabIndex = -1;
                        const copy = document.createElement("span");
                        copy.className = "customer-select-option-copy";
                        const title = document.createElement("span");
                        title.className = "customer-select-option-title";
                        title.textContent = option.textContent;
                        copy.append(title);
                        const description = option.dataset.description || "";
                        if (description) {
                            const detail = document.createElement("small");
                            detail.className =
                                "customer-select-option-description";
                            detail.textContent = description;
                            copy.append(detail);
                        }
                        item.append(copy);
                        if (option.selected) {
                            const check = document.createElement("span");
                            check.className = "customer-select-option-check";
                            check.setAttribute("aria-hidden", "true");
                            check.innerHTML =
                                '<svg viewBox="0 0 24 24" focusable="false"><path d="m5 12 4 4L19 6"/></svg>';
                            item.append(check);
                        }
                        item.addEventListener("click", () => {
                            if (option.disabled) return;
                            select.value = option.value;
                            wrapper.classList.remove("has-invalid");
                            trigger.removeAttribute("aria-invalid");
                            select.dispatchEvent(
                                new Event("change", { bubbles: true }),
                            );
                            control.sync();
                            control.close(true);
                        });
                        item.addEventListener("keydown", (event) =>
                            control.onKeyDown(event),
                        );
                        item.addEventListener("pointermove", () => {
                            control.activeIndex = index;
                        });
                        return item;
                    }),
                );
                trigger.title = selected?.textContent || "";
            },
            open() {
                if (select.disabled) return;
                closeAll(control);
                control.sync();
                wrapper.classList.add("is-open");
                trigger.setAttribute("aria-expanded", "true");
                control.activeIndex = Math.max(0, select.selectedIndex);
                menu.querySelectorAll("[role=option]")[
                    control.activeIndex
                ]?.focus();
            },
            onKeyDown(event) {
                const items = [
                    ...menu.querySelectorAll("[role=option]:not(:disabled)"),
                ];
                if (event.key === "Escape") {
                    event.preventDefault();
                    control.close(true);
                    return;
                }
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    if (!wrapper.classList.contains("is-open")) {
                        control.open();
                        return;
                    }
                    const direction = event.key === "ArrowDown" ? 1 : -1;
                    control.activeIndex = Math.max(
                        0,
                        Math.min(
                            items.length - 1,
                            control.activeIndex + direction,
                        ),
                    );
                    items[control.activeIndex]?.focus();
                    return;
                }
                if (event.key === "Home" || event.key === "End") {
                    event.preventDefault();
                    control.activeIndex =
                        event.key === "Home" ? 0 : items.length - 1;
                    items[control.activeIndex]?.focus();
                    return;
                }
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (!wrapper.classList.contains("is-open")) {
                        control.open();
                        return;
                    }
                    items
                        .find((item) => item === document.activeElement)
                        ?.click();
                }
            },
        };
        controls.set(select, control);
        control.sync();
        trigger.addEventListener("click", () =>
            wrapper.classList.contains("is-open")
                ? control.close()
                : control.open(),
        );
        trigger.addEventListener("keydown", (event) =>
            control.onKeyDown(event),
        );
        select.addEventListener("change", () => control.sync());
        select.addEventListener("invalid", (event) => {
            event.preventDefault();
            wrapper.classList.add("has-invalid");
            trigger.setAttribute("aria-invalid", "true");
            trigger.focus();
        });
        const observer = new MutationObserver(() => control.sync());
        observer.observe(select, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["disabled", "selected", "label", "value"],
        });
        select.labels?.forEach((label) =>
            label.addEventListener("click", (event) => {
                if (event.target.closest(".customer-select")) return;
                event.preventDefault();
                trigger.focus();
                control.open();
            }),
        );
    }

    function syncAll() {
        document
            .querySelectorAll(".customer-select-native")
            .forEach((select) => controls.get(select)?.sync());
    }

    selects.forEach(enhance);
    document.addEventListener("click", (event) => {
        if (!event.target.closest(".customer-select")) closeAll();
    });
    document.addEventListener("reset", () => setTimeout(syncAll, 0));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeAll();
    });
    window.CustomerSelects = { syncAll };
})();
