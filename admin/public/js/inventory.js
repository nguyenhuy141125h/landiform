(() => {
    const source = document.querySelector("#inventoryCatalogExamples, #productRecordExamples");

    function fromMarkup() {
        if (!source) return [];
        return [...source.querySelectorAll("[data-id]")].map((element) => {
            const data = { ...element.dataset };
            const floorMatch = /\d+/.exec(data.floor || "");
            const numeric = (value) => value === "" || value == null ? null : Number(String(value).replace(",", "."));
            const attributes = {};
            ["bedrooms", "bathrooms", "storeys", "frontage", "depth"].forEach((key) => {
                if (data[key] !== "" && data[key] != null) attributes[key] = numeric(data[key]);
            });
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
                number: String(data.code || "").split(/[·.]/).pop()?.trim() || "",
                code: data.code || "",
                type: data.type || "",
                area: numeric(data.area),
                price: numeric(data.price),
                commissionPercent: numeric(data.commission),
                status: data.status || "",
                productGroup: data.group || "",
                categoryId: window.LandiformCategories?.findByName(data.type)?.id || "",
                attributes,
            };
        });
    }

    function fromInventoryTable() {
        const body = document.querySelector("#inventoryTableBody");
        if (!body) return [];
        const projectOptions = [...document.querySelectorAll("#inventoryProjectFilter option")];
        return [...body.querySelectorAll("tr")].map((row) => {
            const cells = [...row.cells];
            if (cells.length < 10) return null;
            const project = cells[1].textContent.trim();
            const projectCode = projectOptions.find((option) => option.textContent.trim() === project)?.value || "";
            const href = row.querySelector('a[href*="product-detail.html"]')?.href || "";
            const id = new URL(href, location.href).searchParams.get("id") || row.dataset.unitId || "";
            const type = cells[4].textContent.trim();
            const specification = cells[5].textContent.trim();
            const bedroomCount = /([0-9]+)\s*PN/i.exec(specification);
            const bathroomCount = /([0-9]+)\s*PT/i.exec(specification);
            const floorMatch = /\d+/.exec(cells[3].textContent);
            const parseNumber = (value) => Number(String(value || "").replace(/[^0-9,.-]/g, "").replace(",", ".")) || 0;
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
                categoryId: window.LandiformCategories?.findByName(type)?.id || "",
                attributes: {
                    ...(bedroomCount ? { bedrooms: Number(bedroomCount[1]) } : {}),
                    ...(bathroomCount ? { bathrooms: Number(bathroomCount[1]) } : {}),
                },
            };
        }).filter((unit) => unit && unit.id);
    }

    function all() {
        const markupRecords = fromMarkup();
        return markupRecords.length ? markupRecords : fromInventoryTable();
    }

    function replace(records) {
        document.dispatchEvent(new CustomEvent("landiform:backend-submit", {
            detail: { entity: "inventory", records },
        }));
        return false;
    }

    window.LandiformInventory = Object.freeze({ all, replace });
})();
