(() => {
    const source = document.querySelector("#recordExamples");
    const form = document.querySelector("#recordDetailForm");
    const notFound = document.querySelector("#recordNotFound");
    if (!source || !form || !notFound) return;
    const records = [...source.querySelectorAll("[data-type][data-id]")].map((element) => {
        const record = { ...element.dataset };
        for (const [key, value] of Object.entries(record)) {
            if (value === "true") record[key] = true;
            else if (value === "false") record[key] = false;
        }
        return record;
    });
    const params = new URLSearchParams(location.search);
    const kind = params.get("type");
    const id = params.get("id");
    let record = records.find((item) => item.type === kind && item.id === id);
    if (!record && ["buyer", "appointment"].includes(kind) && (params.has("name") || params.has("customer"))) {
        record = Object.fromEntries(params.entries());
    }
    const schemaNode = [...document.querySelectorAll("#recordSchemas [data-type]")].find((item) => item.dataset.type === kind);
    const schema = schemaNode ? {
        ...schemaNode.dataset,
        fields: [...schemaNode.querySelectorAll("[data-record-field]")].map((field) => ({
            key: field.dataset.recordField,
            label: field.dataset.label,
            type: field.dataset.control,
            readonly: field.dataset.readonly === "true",
            options: [...field.querySelectorAll("option")].map((option) => option.value),
        })),
        checks: [...schemaNode.querySelectorAll("[data-record-check]")].map((field) => ({ key: field.dataset.recordCheck, label: field.dataset.label })),
        facts: (schemaNode.dataset.facts || "").split(/\s+/).filter(Boolean),
    } : null;
    if (!record || !schema) {
        form.hidden = true;
        notFound.hidden = false;
        notFound.querySelector("#recordNotFoundLink").href = schema?.back || "../index.html";
        return;
    }
    const fields = document.querySelector("#recordFields");
    const checks = document.querySelector("#recordChecks");
    const makeField = ({ key: name, label, type, options, readonly }) => {
        const wrapper = document.createElement("label");
        wrapper.className = "field";
        const caption = document.createElement("span");
        caption.textContent = label;
        const control = type === "select" ? document.createElement("select") : document.createElement("input");
        control.name = name;
        if (type !== "select") control.type = type;
        if (readonly) control.readOnly = true;
        if (type === "select") {
            options.forEach((option) => control.add(new Option(option, option)));
            if (record[name] && ![...control.options].some((option) => option.value === record[name])) {
                control.add(new Option(record[name], record[name]));
            }
        }
        control.value = record[name] || "";
        wrapper.append(caption, control);
        return wrapper;
    };
    schema.fields.forEach((field) => fields.append(makeField(field)));
    if (schema.checks) {
        checks.hidden = false;
        schema.checks.forEach(({ key: name, label }) => {
            const wrapper = document.createElement("label");
            wrapper.className = "record-check";
            const control = document.createElement("input");
            control.type = "checkbox";
            control.name = name;
            control.checked = Boolean(record[name]);
            const text = document.createElement("span");
            text.textContent = label;
            wrapper.append(control, text);
            checks.append(wrapper);
        });
    }
    const titleValue = record.name || record.code || record.customer || record.id;
    document.title = `${titleValue} | LANDIFORM`;
    document.querySelector("#recordEyebrow").textContent = schema.eyebrow;
    document.querySelector("#recordTitle").textContent = titleValue;
    document.querySelector("#recordSubtitle").textContent = `${schema.label} · ${record.project || record.parent || "LANDIFORM"}`;
    document.querySelector("#recordBadge").textContent = schema.label;
    document.querySelector("#recordSectionTitle").textContent = schema.title;
    document.querySelector("#recordSectionIntro").textContent = schema.intro;
    document.querySelector("#recordHelpText").textContent = schema.help;
    document.querySelector("#recordSummaryTitle").textContent = titleValue;
    document.querySelector("#recordSummarySubtitle").textContent = schema.label;
    document.querySelector("#recordBackLink").href = schema.back;
    document.querySelector("#recordCancelLink").href = schema.back;
    document.querySelector("#recordNotFoundLink").href = schema.back;
    const facts = document.querySelector("#recordSummaryFacts");
    schema.facts.forEach((key) => {
        const definition = schema.fields.find((field) => field.key === key);
        const row = document.createElement("div");
        const term = document.createElement("dt");
        const value = document.createElement("dd");
        term.textContent = definition?.[1] || key;
        value.textContent = record[key] || "—";
        row.append(term, value);
        facts.append(row);
    });
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        document.dispatchEvent(new CustomEvent("landiform:backend-submit", { detail: { form, values: new FormData(form) } }));
    });
})();
