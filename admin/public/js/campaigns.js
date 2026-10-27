(() => {
    const modal = document.querySelector("#campaignModal");
    const form = document.querySelector("#campaignForm");
    const tbody = document.querySelector("#campaignTableBody");
    const toast = document.querySelector("#toastMessage");
    if (!modal || !form || !tbody) return;

    const storageKey = "landiform.admin.campaigns.v1";
    const projectRelations = {
        "An Phú Riverside": { projectCode: "AP-026", formId: "consult" },
        "Green Valley": { projectCode: "GV-014", formId: "price" },
        "Central Park Towers": { projectCode: "CP-008", formId: "viewing" },
        "Lumière Garden": { projectCode: "LG-031", formId: "" },
    };
    const channelMeta = {
        google: { label: "Google Ads", source: "google", medium: "cpc", icon: "fa-magnifying-glass", tone: "blue" },
        meta: { label: "Meta Ads", source: "meta", medium: "paid-social", icon: "fa-share-nodes", tone: "violet" },
        qr: { label: "QR / Sự kiện", source: "qr", medium: "offline", icon: "fa-qrcode", tone: "green" },
        email: { label: "Email", source: "email", medium: "email", icon: "fa-envelope", tone: "amber" },
        organic: { label: "SEO", source: "google", medium: "organic", icon: "fa-magnifying-glass", tone: "violet" },
    };
    const seedCampaigns = [
        { id: "campaign-an-phu-launch-1", name: "Mở bán An Phú · Đợt 1", slug: "an-phu-launch-1", project: "An Phú Riverside", channel: "google", budget: 45000000, trackingUrl: "https://anphatland.vn/customer/index.html?project=AP-026&utm_source=google&utm_medium=cpc&utm_campaign=an-phu-launch-1", ...projectRelations["An Phú Riverside"] },
        { id: "campaign-central-park-event", name: "Sự kiện giới thiệu dự án", slug: "central-park-event", project: "Central Park Towers", channel: "qr", budget: 8000000, trackingUrl: "https://anphatland.vn/customer/index.html?project=CP-008&utm_source=qr&utm_medium=offline&utm_campaign=central-park-event", ...projectRelations["Central Park Towers"] },
        { id: "campaign-green-valley-organic", name: "Tìm kiếm tự nhiên", slug: "green-valley-organic", project: "Green Valley", channel: "organic", budget: 0, trackingUrl: "https://anphatland.vn/customer/index.html?project=GV-014&utm_source=google&utm_medium=organic&utm_campaign=green-valley-organic", ...projectRelations["Green Valley"] },
        { id: "campaign-an-phu-meta-oct", name: "Mở bán An Phú · Meta tháng 10", slug: "an-phu-meta-oct", project: "An Phú Riverside", channel: "meta", budget: 18000000, trackingUrl: "https://anphatland.vn/customer/index.html?project=AP-026&utm_source=meta&utm_medium=paid-social&utm_campaign=an-phu-meta-oct", ...projectRelations["An Phú Riverside"] },
    ];
    const seedCampaignIds = new Set(seedCampaigns.map((campaign) => campaign.id));
    let campaigns = [];
    try {
        const stored = JSON.parse(null || "[]");
        if (Array.isArray(stored)) campaigns = stored;
    } catch {
        campaigns = [];
    }
    const campaignIds = new Set(campaigns.map((campaign) => campaign.id));
    campaigns = [...campaigns, ...seedCampaigns.filter((campaign) => !campaignIds.has(campaign.id))];
    const seedCampaignById = new Map(seedCampaigns.map((campaign) => [campaign.id, campaign]));
    campaigns.forEach((campaign) => {
        const seed = seedCampaignById.get(campaign.id);
        if (seed) campaign.trackingUrl = seed.trackingUrl;
    });
    try { void 0; } catch { /* Keep the campaign examples in memory. */ }

    function notify(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("is-visible");
        window.clearTimeout(notify.timer);
        notify.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    function slugify(value) {
        return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
            .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }

    function money(value) {
        return new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + " ₫";
    }

    function createCell(text) {
        const cell = document.createElement("td");
        cell.textContent = text;
        return cell;
    }

    function renderCampaign(campaign) {
        const meta = channelMeta[campaign.channel] || channelMeta.google;
        const row = document.createElement("tr");
        row.id = campaign.id || "";
        row.dataset.campaignId = campaign.id || "";
        row.dataset.projectCode = campaign.projectCode || projectRelations[campaign.project]?.projectCode || "";
        row.dataset.formId = campaign.formId || projectRelations[campaign.project]?.formId || "";
        const campaignCell = document.createElement("td");
        const entity = document.createElement("span");
        entity.className = "screen-entity";
        const icon = document.createElement("span");
        icon.className = `screen-entity-icon ${meta.tone}`;
        const iconGlyph = document.createElement("i");
        iconGlyph.className = `fa-solid ${meta.icon}`;
        iconGlyph.setAttribute("aria-hidden", "true");
        icon.append(iconGlyph);
        const details = document.createElement("span");
        const name = document.createElement("strong");
        name.textContent = campaign.name;
        const slug = document.createElement("small");
        slug.textContent = campaign.slug;
        details.append(name, slug);
        entity.append(icon, details);
        campaignCell.append(entity);
        row.append(campaignCell, createCell(meta.label), createCell(campaign.project), createCell(money(campaign.budget)), createCell("0"), createCell("—"), createCell("0"), createCell("—"));

        const stateCell = document.createElement("td");
        const state = document.createElement("span");
        state.className = "screen-badge blue";
        state.textContent = "Mới tạo";
        stateCell.append(state);
        row.append(stateCell);

        const linkCell = document.createElement("td");
        const link = document.createElement("a");
        link.className = "campaign-link";
        link.href = campaign.trackingUrl;
        link.target = "_blank";
        link.rel = "noopener";
        link.append(document.createTextNode("Mở landing page "));
        const externalIcon = document.createElement("i");
        externalIcon.className = "fa-solid fa-arrow-up-right-from-square";
        externalIcon.setAttribute("aria-hidden", "true");
        link.append(externalIcon);
        linkCell.append(link);
        const copyButton = document.createElement("button");
        copyButton.className = "campaign-copy";
        copyButton.type = "button";
        copyButton.dataset.copyUrl = campaign.trackingUrl;
        copyButton.textContent = "Sao chép UTM";
        linkCell.append(copyButton);
        row.append(linkCell);
        tbody.prepend(row);
    }

    campaigns.filter((campaign) => !seedCampaignIds.has(campaign.id)).slice().reverse().forEach(renderCampaign);

    function close() {
        modal.hidden = true;
        document.body.classList.remove("modal-open");
        form.reset();
    }

    document.querySelector("[data-campaign-open]")?.addEventListener("click", () => {
        modal.hidden = false;
        document.body.classList.add("modal-open");
        form.elements.name.focus();
    });
    document.querySelectorAll("[data-campaign-close]").forEach((button) => button.addEventListener("click", close));
    modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) close(); });

    tbody.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-copy-url]");
        if (!button) return;
        const value = button.dataset.copyUrl;
        try {
            await navigator.clipboard.writeText(value);
            notify("Đã sao chép liên kết theo dõi.");
        } catch {
            const field = document.createElement("textarea");
            field.value = value;
            field.setAttribute("readonly", "");
            field.style.position = "fixed";
            field.style.opacity = "0";
            document.body.append(field);
            field.select();
            const copied = document.execCommand("copy");
            field.remove();
            notify(copied ? "Đã sao chép liên kết theo dõi." : "Không thể sao chép. Hãy mở landing page để lấy liên kết.");
        }
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const channel = form.elements.channel.value;
        const meta = channelMeta[channel] || channelMeta.google;
        const name = form.elements.name.value.trim();
        const slug = slugify(name) || `campaign-${Date.now()}`;
        let trackingUrl;
        try {
            const url = new URL(form.elements.url.value.trim());
            if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Invalid scheme");
            url.searchParams.set("utm_source", meta.source);
            url.searchParams.set("utm_medium", meta.medium);
            url.searchParams.set("utm_campaign", slug);
            trackingUrl = url.toString();
        } catch {
            notify("Vui lòng nhập địa chỉ landing page hợp lệ.");
            return;
        }

        const campaign = {
            id: `campaign-${slug}`,
            name,
            slug,
            project: form.elements.project.value,
            ...projectRelations[form.elements.project.value],
            channel,
            budget: Number(form.elements.budget.value) || 0,
            trackingUrl,
        };
        campaigns.push(campaign);
        try {
            void 0;
        } catch {
            campaigns.pop();
            notify("Không thể lưu chiến dịch trên trình duyệt này.");
            return;
        }
        renderCampaign(campaign);
        close();
        notify("Đã tạo liên kết UTM và lưu chiến dịch.");
    });
})();

