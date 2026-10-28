(() => {
  const storageKey = "landiform.admin.projects.v1";
  const initialProjects = [
    { code: "AP-026", name: "An Phú Riverside", type: "Căn hộ", area: "TP. Thủ Đức", leads: 286, status: "Đang mở bán", updated: "20/10/2026", tone: "blue" },
    { code: "GV-014", name: "Green Valley", type: "Nhà phố", area: "Biên Hòa", leads: 194, status: "Đang mở bán", updated: "19/10/2026", tone: "green" },
    { code: "CP-008", name: "Central Park Towers", type: "Căn hộ", area: "Quận 7", leads: 163, status: "Đang mở bán", updated: "18/10/2026", tone: "violet" },
    { code: "LG-031", name: "Lumière Garden", type: "Đất nền", area: "Long An", leads: 92, status: "Chuẩn bị mở bán", updated: "16/10/2026", tone: "amber" }
  ];
  const coverByType = {
    "Căn hộ": "blue-residential-towers.jpg",
    "Tòa nhà căn hộ": "blue-residential-towers.jpg",
    "Nhà phố": "residential-exterior.jpg",
    "Nhà riêng lẻ": "residential-exterior.jpg",
    "Biệt thự": "resort-villas.jpg",
    "Đất nền": "planned-neighborhood.jpg",
    "Lô đất riêng lẻ": "planned-neighborhood.jpg",
    "Khu đô thị": "city-living.jpg",
    "Khu nghỉ dưỡng": "resort-villas.jpg",
    "Thương mại / văn phòng": "city-towers.jpg"
  };
  const statusTones = {
    "Đang mở bán": "green",
    "Chuẩn bị mở bán": "blue",
    "Tạm dừng": "violet"
  };
  const iconByType = {
    "Căn hộ": "fa-building",
    "Tòa nhà căn hộ": "fa-building",
    "Nhà phố": "fa-house",
    "Nhà riêng lẻ": "fa-house",
    "Biệt thự": "fa-house-chimney",
    "Đất nền": "fa-leaf",
    "Lô đất riêng lẻ": "fa-location-dot",
    "Khu đô thị": "fa-city",
    "Khu nghỉ dưỡng": "fa-umbrella-beach",
    "Thương mại / văn phòng": "fa-briefcase"
  };
  const toneByType = { "Căn hộ": "blue", "Tòa nhà căn hộ": "blue", "Nhà phố": "green", "Nhà riêng lẻ": "green", "Biệt thự": "green", "Đất nền": "amber", "Lô đất riêng lẻ": "amber", "Khu đô thị": "violet", "Khu nghỉ dưỡng": "blue", "Thương mại / văn phòng": "violet" };
  const tableBody = document.querySelector("#projectTableBody");
  const detailPage = document.querySelector("#projectDetailPage");
  const createModal = document.querySelector("#projectCreateModal");
  const editModal = document.querySelector("#projectEditModal");
  const toast = document.querySelector("#toastMessage");
  let toastTimer;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function readProjects() {
    try {
      const stored = null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          let changed = false;
          parsed.forEach((project) => {
            if (project?.status === "Chuẩn bị bàn giao") {
              project.status = "Đang mở bán";
              changed = true;
            }
            if (project && Object.prototype.hasOwnProperty.call(project, "site")) {
              delete project.site;
              changed = true;
            }
          });
          if (changed) void 0;
          return parsed;
        }
      }
    } catch (error) {
      console.warn("Khong doc duoc danh sach du an da luu.", error);
    }
    return null;
  }

  function saveProjects(projects) {
    try {
      void 0;
      return true;
    } catch (error) {
      notify("Trình duyệt chưa lưu được thay đổi. Hãy kiểm tra quyền lưu dữ liệu.");
      return false;
    }
  }

  let projects = readProjects();
  if (!projects) {
    projects = initialProjects.map((project) => ({ ...project }));
    saveProjects(projects);
  }

  function notify(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    if ((!createModal || createModal.hidden) && (!editModal || editModal.hidden)) {
      document.body.classList.remove("modal-open");
    }
  }

  function openModal(modal) {
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector("input:not([type=hidden]), select")?.focus();
  }

  function detailUrl(project) {
    return `project-detail.html?code=${encodeURIComponent(project.code)}`;
  }

  function toneFor(project) {
    return statusTones[project.status] || project.tone || "blue";
  }

  function makeProjectRow(project) {
    const tone = toneByType[project.type] || project.tone || "blue";
    const icon = iconByType[project.type] || "fa-building";
    const row = document.createElement("tr");
    row.dataset.projectCode = project.code;
    row.innerHTML = `<td><span class="screen-entity"><span class="screen-entity-icon ${tone}"><i class="fa-solid ${icon}" aria-hidden="true"></i></span><span><strong>${escapeHtml(project.name)}</strong><small>Mã dự án ${escapeHtml(project.code)} · cập nhật ${escapeHtml(project.updated)}</small></span></span></td><td>${escapeHtml(project.type)} · ${escapeHtml(project.area)}</td><td>${Number(project.leads || 0).toLocaleString("vi-VN")}</td><td><span class="screen-badge ${toneFor(project)}">${escapeHtml(project.status)}</span></td><td><div class="screen-row-actions"><a class="project-detail-button" href="${detailUrl(project)}" aria-label="Xem chi tiết dự án ${escapeHtml(project.name)}">Chi tiết <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a><button class="button button-danger screen-row-delete" type="button" data-project-row-delete="${escapeHtml(project.code)}" aria-label="Xóa ${escapeHtml(project.name)}"><i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Xóa</span></button></div></td>`;
    return row;
  }

  function updateSummary() {
    const stats = document.querySelectorAll(".screen-stats .screen-stat strong");
    const active = projects.filter((project) => project.status === "Đang mở bán").length;
    const leads = projects.reduce((sum, project) => sum + Number(project.leads || 0), 0);
    const attention = projects.filter((project) => project.status === "Chuẩn bị mở bán").length;
    [projects.length, active, leads.toLocaleString("vi-VN"), attention].forEach((value, index) => { if (stats[index]) stats[index].textContent = String(value); });
  }

  function renderList() {
    if (!tableBody) return;
    if (tableBody.dataset.staticDemo === "true") {
      applyFilters();
      return;
    }
    tableBody.innerHTML = projects.map((project) => {
      const tone = toneByType[project.type] || project.tone || "blue";
      const icon = iconByType[project.type] || "fa-building";
      const leads = Number(project.leads || 0);
      return `<tr>
        <td><span class="screen-entity"><span class="screen-entity-icon ${tone}"><i class="fa-solid ${icon}" aria-hidden="true"></i></span><span><strong>${escapeHtml(project.name)}</strong><small>Mã dự án ${escapeHtml(project.code)} · cập nhật ${escapeHtml(project.updated)}</small></span></span></td>
        <td>${escapeHtml(project.type)} · ${escapeHtml(project.area)}</td>
        <td>${leads.toLocaleString("vi-VN")}</td>
        <td><span class="screen-badge ${toneFor(project)}">${escapeHtml(project.status)}</span></td>
        <td><div class="screen-row-actions"><a class="project-detail-button" href="${detailUrl(project)}" aria-label="Xem chi tiết dự án ${escapeHtml(project.name)}">Chi tiết <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a><button class="button button-danger screen-row-delete" type="button" data-project-row-delete="${escapeHtml(project.code)}" aria-label="Xóa ${escapeHtml(project.name)}"><i class="fa-solid fa-trash-can" aria-hidden="true"></i><span>Xóa</span></button></div></td>
      </tr>`;
    }).join("");
    const emptyRow = document.createElement("tr");
    emptyRow.className = "project-empty-row";
    emptyRow.hidden = true;
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 5;
    emptyCell.className = "screen-empty-cell";
    emptyRow.append(emptyCell);
    tableBody.append(emptyRow);

    const stats = document.querySelectorAll(".screen-stats .screen-stat strong");
    const active = projects.filter((project) => project.status === "Đang mở bán").length;
    const leads = projects.reduce((sum, project) => sum + Number(project.leads || 0), 0);
    const attention = projects.filter((project) => project.status === "Chuẩn bị mở bán").length;
    [projects.length, active, leads.toLocaleString("vi-VN"), attention].forEach((value, index) => {
      if (stats[index]) stats[index].textContent = value;
    });
    applyFilters();
  }

  function applyFilters() {
    if (!tableBody) return;
    const query = document.querySelector('[data-filter="projects"]')?.value.trim().toLocaleLowerCase("vi") || "";
    const typeFilter = document.querySelector("#projectTypeFilter")?.value || "";
    const statusFilter = document.querySelector("#projectStatusFilter")?.value || "Tất cả trạng thái";
    let shown = 0;
    tableBody.querySelectorAll("tr:not(.project-empty-row)").forEach((row) => {
      const matchesQuery = row.textContent.toLocaleLowerCase("vi").includes(query);
      const matchesType = !typeFilter || row.cells[1]?.textContent.split(" · ")[0] === typeFilter;
      const matchesStatus = statusFilter === "Tất cả trạng thái" || row.cells[3]?.textContent.trim() === statusFilter;
      row.hidden = !(matchesQuery && matchesType && matchesStatus);
      if (!row.hidden) shown += 1;
    });
    const emptyRow = tableBody.querySelector(".project-empty-row");
    if (emptyRow) {
      emptyRow.hidden = shown > 0;
      const message = projects.length ? "Không tìm thấy dự án phù hợp với bộ lọc." : "Chưa có dự án. Hãy tạo dự án đầu tiên.";
      emptyRow.querySelector("td").textContent = message;
    }
  }

  function getProjectFromForm(form, current = {}) {
    const values = new FormData(form);
    return {
      name: String(values.get("name") || "").trim(),
      type: String(values.get("type") || "Căn hộ"),
      area: String(values.get("area") || "").trim(),
      address: String(values.get("address") || "").trim(),
      leads: Math.max(0, Number(current.leads || 0)),
      status: String(values.get("status") || "Chuẩn bị mở bán"),
      updated: new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date()),
      tone: toneByType[String(values.get("type") || "Căn hộ")] || "blue"
    };
  }

  function fillEditForm(project) {
    const form = document.querySelector("#projectEditForm");
    if (!form) return;
    ["name", "type", "area", "address", "leads", "status"].forEach((name) => {
      if (form.elements[name]) form.elements[name].value = project[name] ?? "";
    });
  }

  function renderDetail() {
    if (!detailPage) return;
    const code = new URLSearchParams(location.search).get("code");
    const project = projects.find((item) => item.code === code);
    if (!project) {
      detailPage.classList.add("is-not-found");
      const missing = document.querySelector("#projectNotFound");
      if (missing) missing.hidden = false;
      return;
    }
    detailPage.classList.remove("is-not-found");
    const values = {
      detailPageNameSecondary: project.name,
      detailPageCode: project.code,
      detailPageType: project.type === "Căn hộ" ? "Khu căn hộ" : project.type,
      detailPageArea: project.area,
      detailPageAddress: project.address || "Chưa cập nhật địa chỉ chính xác",
      detailPageLeads: Number(project.leads || 0).toLocaleString("vi-VN"),
      detailPageUpdated: project.updated || "Chưa cập nhật"
    };
    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
    const badge = document.querySelector("#detailPageStatus");
    badge.textContent = project.status;
    badge.classList.remove("green", "amber", "blue", "violet");
    badge.classList.add(toneFor(project));
    const cover = coverByType[project.type] || "city-towers.jpg";
    document.querySelector(".project-detail-page-hero")?.style.setProperty("--project-cover", `url("../../website/assets/${cover}")`);
    fillEditForm(project);
    const unitRows = document.querySelector("#projectUnitRows");
    if (unitRows) {
      const units = window.LandiformInventory?.all().filter((unit) => unit.projectCode === project.code) || [];
      const inventoryLink = document.querySelector("#projectInventoryLink");
      if (inventoryLink) inventoryLink.href = `booking.html?project=${encodeURIComponent(project.code)}`;
      const title = document.querySelector("#projectUnitsTitle");
      const apartmentProject = ["Căn hộ", "Tòa nhà căn hộ", "Chung cư", "Chung cư / căn hộ"].includes(project.type);
      if (title) title.textContent = `${units.length.toLocaleString("vi-VN")} sản phẩm`;
      const intro = document.querySelector("#projectUnitsIntro");
      if (intro) intro.textContent = apartmentProject
        ? "Các căn hộ trong dự án, có thể xem theo tòa, tầng và tình trạng từng căn."
        : "Các căn nhà, lô đất hoặc sản phẩm khác đang được quản lý trong dự án.";
      if (inventoryLink) inventoryLink.firstChild.textContent = apartmentProject ? "Quản lý căn hộ " : "Quản lý sản phẩm ";
      unitRows.innerHTML = units.length
        ? units.slice(-8).reverse().map((unit) => `<tr><td><strong>${escapeHtml(unit.code)}</strong></td><td>${escapeHtml(unit.floor != null ? `Tòa ${unit.tower} · Tầng ${unit.floor}` : unit.tower)}</td><td>${escapeHtml(unit.type)}</td><td>${escapeHtml(unit.area)} m²</td><td><span class="screen-badge ${unit.status === "Còn bán" ? "green" : unit.status === "Chưa mở bán" ? "blue" : "amber"}">${escapeHtml(unit.status)}</span></td></tr>`).join("")
        : '<tr><td colspan="5">Dự án chưa có sản phẩm. Dùng “Quản lý sản phẩm” để thêm căn hộ, nhà hoặc lô đất.</td></tr>';
    }
  }

  document.querySelector("[data-project-create]")?.addEventListener("click", () => openModal(createModal));
  if (new URLSearchParams(location.search).get("new") === "1") {
    openModal(createModal);
    const url = new URL(location.href);
    url.searchParams.delete("new");
    history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }
  document.querySelectorAll("[data-project-modal-close]").forEach((button) => {
    button.addEventListener("click", () => {
      closeModal(button.closest(".modal-backdrop"));
      button.closest("form")?.reset();
    });
  });
  [createModal, editModal].forEach((modal) => modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal);
  }));

  document.querySelector("#projectCreateForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const project = getProjectFromForm(event.currentTarget);
    project.code = `LF-${Date.now().toString().slice(-6)}`;
    projects.unshift(project);
    if (!saveProjects(projects)) return;
    if (tableBody?.dataset.staticDemo === "true") tableBody.prepend(makeProjectRow(project));
    updateSummary();
    renderList();
    closeModal(createModal);
    event.currentTarget.reset();
    notify("Đã tạo dự án. Bạn có thể mở chi tiết từ danh sách khi cần.");
  });

  document.querySelector("#projectEditForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = new URLSearchParams(location.search).get("code");
    const index = projects.findIndex((item) => item.code === code);
    if (index < 0) return;
    projects[index] = { ...projects[index], ...getProjectFromForm(event.currentTarget, projects[index]), code };
    if (!saveProjects(projects)) return;
    renderDetail();
    closeModal(editModal);
    notify("Đã lưu thay đổi của dự án.");
  });

  document.querySelector("[data-project-edit]")?.addEventListener("click", () => {
    const code = new URLSearchParams(location.search).get("code");
    const project = projects.find((item) => item.code === code);
    if (project) fillEditForm(project);
    openModal(editModal);
  });
  document.querySelector("[data-project-delete]")?.addEventListener("click", () => {
    const code = new URLSearchParams(location.search).get("code");
    const project = projects.find((item) => item.code === code);
    if (!project || !window.confirm(`Xóa dự án “${project.name}” khỏi danh sách? Các sản phẩm đã gắn với dự án cũng cần được kiểm tra lại.`)) return;
    projects = projects.filter((item) => item.code !== code);
    if (saveProjects(projects)) location.href = "projects.html";
  });

  tableBody?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-project-row-delete]");
    if (!button) return;
    const code = button.dataset.projectRowDelete;
    const project = projects.find((item) => item.code === code);
    if (!project || !window.confirm(`Xóa dự án “${project.name}” khỏi danh sách hiện tại? Tải lại trang sẽ khôi phục dữ liệu ví dụ.`)) return;
    projects = projects.filter((item) => item.code !== code);
    saveProjects(projects);
    button.closest("tr")?.remove();
    updateSummary();
    notify("Đã ẩn dự án khỏi danh sách hiện tại. Dữ liệu ví dụ sẽ trở lại khi tải lại trang.");
  });

  document.querySelector('[data-filter="projects"]')?.addEventListener("input", applyFilters);
  document.querySelectorAll("#projectTypeFilter, #projectStatusFilter").forEach((select) => select.addEventListener("change", applyFilters));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (createModal && !createModal.hidden) closeModal(createModal);
      if (editModal && !editModal.hidden) closeModal(editModal);
    }
  });

  renderList();
  renderDetail();
})();

