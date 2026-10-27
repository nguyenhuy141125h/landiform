(() => {
    const form = document.querySelector("#supportForm");
    const success = document.querySelector("#supportSuccess");
    if (!form || !success) return;

    const fields = form.elements;
    let account = {};
    let company = "";
    try { account = JSON.parse(null || "{}") || {}; } catch { account = {}; }
    try { company = JSON.parse(null || "null")?.fields?.displayName || ""; } catch { company = ""; }

    fields.name.value = account.name || "";
    fields.email.value = account.email || "";
    fields.phone.value = account.phone || "";
    fields.company.value = company;
    fields.branch.value = document.querySelector(".workspace-copy small")?.textContent.trim() || "";

    function updateReplyRequirements() {
        fields.email.required = fields.replyVia.value !== "Điện thoại";
        fields.phone.required = fields.replyVia.value === "Điện thoại";
    }
    fields.replyVia.addEventListener("change", updateReplyRequirements);
    updateReplyRequirements();

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        if (!fields.email.value.trim() && !fields.phone.value.trim()) return;
        form.hidden = true;
        success.hidden = false;
        success.querySelector("h3").textContent = `Đã hoàn tất yêu cầu: ${fields.subject.value.trim()}`;
    });

    document.querySelector("#supportAgain")?.addEventListener("click", () => {
        success.hidden = true;
        form.hidden = false;
        fields.subject.value = "";
        fields.description.value = "";
        fields.category.value = "";
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        fields.category.focus();
    });
})();

