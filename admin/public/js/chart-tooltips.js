(() => {
    const formatNumber = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
    const numericValue = (value) => Number(String(value || "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) || 0;

    function addTooltip(target, message) {
        if (!target || !message) return;
        target.classList.add("chart-hover-tip");
        target.dataset.chartTip = message;
        target.title = message;
        target.tabIndex = 0;
        target.setAttribute("role", "img");
        target.setAttribute("aria-label", message);
    }

    document.querySelectorAll("#barChart .bar-group").forEach((group) => {
        const month = group.querySelector(":scope > span")?.textContent.trim() || "Tháng";
        group.querySelectorAll(":scope > .bar").forEach((bar) => {
            const series = bar.classList.contains("current") ? "Năm nay" : "Năm trước";
            const height = Number.parseFloat(bar.style.getPropertyValue("--height")) || 0;
            const value = Number(bar.dataset.chartValue ?? Math.round(height * 2));
            const detail = value ? `${formatNumber.format(value)} khách quan tâm` : "Chưa có dữ liệu";
            addTooltip(bar, bar.dataset.chartTip || `${month} · ${series}: ${detail}`);
        });
    });

    document.querySelectorAll(".funnel-panel .funnel-row").forEach((row) => {
        const total = numericValue(row.closest(".funnel-panel")?.querySelector(".funnel-total strong")?.textContent);
        const stage = row.querySelector(".funnel-meta > span")?.textContent.trim() || "Trạng thái";
        const value = numericValue(row.querySelector(".funnel-meta > strong")?.textContent);
        const share = total ? formatNumber.format((value / total) * 100) : "0";
        addTooltip(row, `${stage}: ${formatNumber.format(value)} khách · ${share}% tổng số khách`);
    });

    document.querySelectorAll(".report-funnel > div").forEach((row) => {
        const rows = [...row.parentElement.children];
        const total = numericValue(rows[0]?.querySelector("b")?.textContent);
        const stage = row.querySelector("span")?.textContent.trim() || "Giai đoạn";
        const value = numericValue(row.querySelector("b")?.textContent);
        const share = total ? formatNumber.format((value / total) * 100) : "0";
        addTooltip(row, `${stage}: ${formatNumber.format(value)} khách · ${share}% tổng lượt đăng ký`);
    });

    document.querySelectorAll(".screen-bar-row").forEach((row) => {
        const label = row.querySelector(":scope > span")?.textContent.trim() || "Chỉ số";
        const value = row.querySelector(":scope > strong")?.textContent.trim() || "";
        addTooltip(row, `${label}: ${value}`);
    });
})();
