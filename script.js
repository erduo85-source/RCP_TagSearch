const TYPE_CONFIG = {
  account: {
    title: "账号画像查询",
    tabs: ["login", "payment"],
    tabText: "按账号",
    fields: ["账号名", "通行证ID", "登录手机", "SDKID"],
    placeholders: {
      账号名: "请输入账号名",
      通行证ID: "请输入通行证ID",
      登录手机: "请输入登录手机",
      SDKID: "请输入SDKID",
    },
    hint: "支持通过账号名、通行证ID、登录手机、SDKID，快速检索风险账号",
  },
  device: {
    title: "设备画像查询",
    tabs: ["login", "register", "payment"],
    tabText: "按设备",
    fields: ["设备ID", "设备指纹"],
    placeholders: {
      设备ID: "请输入设备ID",
      设备指纹: "请输入设备指纹",
    },
    hint: "支持通过设备ID、设备指纹，快速检索风险账号",
  },
  ip: {
    title: "IP画像查询",
    tabs: ["login", "register", "payment"],
    tabText: "按IP",
    fields: ["IP"],
    placeholders: {
      IP: "请输入IP地址",
    },
    hint: "支持通过IP地址，快速检索风险账号",
  },
};

const LOG_LABELS = {
  login: "登录",
  register: "注册",
  payment: "支付",
};

const ACTIONS = ["验证码验证", "验证码验证通过", "滑块验证", "滑块验证通过", "放行", "拦截"];

const state = {
  type: "account",
  values: {
    account: "",
    device: "",
    ip: "",
  },
  fields: {
    account: "账号名",
    device: "设备ID",
    ip: "IP",
  },
  logType: "login",
  pageSize: 5,
  empty: false,
  modal: null,
};

const tabs = Array.from(document.querySelectorAll(".tab"));
const fieldSelect = document.querySelector("#fieldSelect");
const queryInput = document.querySelector("#queryInput");
const hintText = document.querySelector("#hintText");
const errorText = document.querySelector("#errorText");
const queryForm = document.querySelector(".query-form");
const queryButton = document.querySelector("#queryButton");
const modal = document.querySelector("#resultModal");
const modalTitle = document.querySelector("#modalTitle");
const modalBody = document.querySelector(".modal-body");
const toast = document.querySelector("#toast");

let toastTimer;

function getPlaceholder(type = state.type, field = state.fields[type]) {
  return TYPE_CONFIG[type].placeholders[field] || `请输入${field}`;
}

function renderFieldOptions(type, preferredField) {
  const fields = TYPE_CONFIG[type].fields;
  const nextField = fields.includes(preferredField) ? preferredField : fields[0];
  state.fields[type] = nextField;
  fieldSelect.innerHTML = fields.map((field) => `<option value="${field}">${field}</option>`).join("");
  fieldSelect.value = nextField;
}

function applyType(type, preferredField) {
  state.values[state.type] = queryInput.value;
  state.type = type;
  const config = TYPE_CONFIG[type];

  tabs.forEach((tab) => {
    const selected = tab.dataset.type === type;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
  });

  renderFieldOptions(type, preferredField || state.fields[type]);
  queryInput.value = state.values[type] || "";
  queryInput.placeholder = getPlaceholder(type);
  hintText.textContent = config.hint;
  errorText.textContent = "";
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function copyButton(label, value) {
  return `<button class="copy-btn" type="button" data-copy-label="${label}" data-copy-value="${value}"><i class="ti ti-copy"></i></button>`;
}

function copyValue(label, value) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(value || "").catch(() => undefined);
  }
  showToast(`${label}复制成功`);
}

function getModalType() {
  return state.modal?.type || state.type;
}

function getModalField(type = getModalType()) {
  if (state.modal?.type === type && state.modal.field) {
    return state.modal.field;
  }
  return state.fields[type];
}

function getModalValue() {
  return state.modal?.value ?? queryInput.value.trim();
}

function renderSectionTitle(title, options = {}) {
  const { toggle = false, expanded = true } = options;
  if (!toggle) {
    return `<div class="section-title"><span class="section-mark"></span><span>${title}</span></div>`;
  }
  return `
    <button id="infoToggle" class="section-title account-toggle" type="button" aria-expanded="${expanded}">
      <span class="section-mark"></span>
      <span>${title}</span>
      <i class="ti ti-chevron-down account-caret" aria-hidden="true"></i>
    </button>
  `;
}

function renderFieldRow(label, value, copy = false) {
  return `
    <p>
      <span>${label}</span>
      <strong>${value}</strong>
      ${copy ? copyButton(label, value) : ""}
    </p>
  `;
}

function renderAccountInfo(queryValue) {
  const field = getModalField("account");
  const account = field === "\u8d26\u53f7\u540d" && queryValue ? queryValue : "10001_12392193311";
  const passport = field === "\u901a\u884c\u8bc1ID" && queryValue ? queryValue : "sgs123123";
  const sdk = field === "SDKID" && queryValue ? queryValue : "1239129319239";
  return `
    <section class="portrait-section info-section">
      ${renderSectionTitle("账号信息", { toggle: true, expanded: false })}
      <div class="info-card">
        <div class="account-summary">
          <div class="summary-cell"><span>账号名：</span><strong>${account}</strong>${copyButton("账号名", account)}</div>
          <div class="summary-cell"><span>通行证ID：</span><strong>${passport}</strong>${copyButton("通行证ID", passport)}</div>
          <div class="summary-cell"><span>SDKID：</span><strong>${sdk}</strong>${copyButton("SDKID", sdk)}</div>
        </div>
        <div id="infoDetails" class="account-details" hidden>
          <div class="detail-group">
            <h3>账号绑定信息</h3>
            ${renderFieldRow("登录手机", "152****9728", true)}
            ${renderFieldRow("安全手机", "152****9728", true)}
            ${renderFieldRow("安全邮箱", "67**32@qq.com", true)}
            ${renderFieldRow("实名认证", "已成年", true)}
          </div>
          <div class="detail-group">
            <h3>最近登录信息</h3>
            ${renderFieldRow("登录时间", "2026-07-20 18:33:22")}
            ${renderFieldRow("登录IP", "192.186.137.10(上海)", true)}
            ${renderFieldRow("登录设备ID", "de12381218...", true)}
            ${renderFieldRow("登录方式", "账密登录")}
          </div>
          <div class="detail-group">
            <h3>账号注册信息</h3>
            ${renderFieldRow("注册时间", "2026-07-20 18:33:22")}
            ${renderFieldRow("注册IP", "192.186.137.10(上海)", true)}
            ${renderFieldRow("注册设备ID", "de12381218...", true)}
            ${renderFieldRow("注册方式", "账密注册")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderDeviceInfo(queryValue) {
  const field = getModalField("device");
  const deviceId = field === "\u8bbe\u5907ID" && queryValue ? queryValue : "21312391923193193123";
  const finger = field === "\u8bbe\u5907\u6307\u7eb9" && queryValue ? queryValue : "1238123912391923919391923913";
  return `
    <section class="portrait-section info-section">
      ${renderSectionTitle("设备信息", { toggle: true, expanded: true })}
      <div class="info-card">
        <div class="device-summary">
          <div class="summary-cell"><span>设备ID：</span><strong>${deviceId}</strong>${copyButton("设备ID", deviceId)}</div>
          <div class="summary-cell"><span>设备指纹：</span><strong>${finger}</strong>${copyButton("设备指纹", finger)}</div>
        </div>
        <div id="infoDetails" class="device-details">
          <div class="device-detail-col">
            ${renderFieldRow("设备品牌", "小米")}
            ${renderFieldRow("系统类型", "Android")}
          </div>
          <div class="device-detail-col">
            ${renderFieldRow("设备型号", "mi 17 pro max")}
            ${renderFieldRow("操作系统版本", "Android V17.2")}
          </div>
          <div class="device-detail-col no-border">
            ${renderFieldRow("设备语言", "EN")}
            ${renderFieldRow("是否为模拟器", "否")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderIpInfo(queryValue) {
  const ip = queryValue || "192.168.200.10";
  return `
    <section class="portrait-section info-section">
      ${renderSectionTitle("IP信息", { toggle: true, expanded: true })}
      <div class="info-card">
        <div class="device-summary one-line">
          <div class="summary-cell"><span>IP地址</span><strong>${ip}</strong>${copyButton("IP地址", ip)}</div>
        </div>
        <div id="infoDetails" class="device-details ip-details">
          <div class="device-detail-col">${renderFieldRow("IP归属地", "中国 上海")}</div>
          <div class="device-detail-col">${renderFieldRow("网络类型", "5G")}</div>
          <div class="device-detail-col no-border">${renderFieldRow("网络运营商", "中国移动")}</div>
        </div>
      </div>
    </section>
  `;
}

function renderTags() {
  const type = getModalType();
  const tags = {
    account: ["信任期限号", "被盗盲盒账号", "其他账号标签示例", "自动换行展示", "超出一行时展示按钮“查看更多”", "其他账号标签示例", "自动换行展示", "示例", "示例"],
    device: ["盗号设备", "刷号设备"],
    ip: ["黑产IP"],
  }[type];
  return `
    <section class="portrait-section tag-section">
      ${renderSectionTitle("标签信息")}
      <div id="tagWrap" class="tag-wrap collapsed">
        ${tags.map((tag, index) => `<span class="risk-tag${index === 0 && type === "account" ? " trust" : ""}">${tag}</span>`).join("")}
        ${tags.length > 4 ? `<button id="moreTags" class="more-tags" type="button">查看更多 &gt;</button>` : ""}
      </div>
    </section>
  `;
}

function buildRows(type, logType) {
  return Array.from({ length: 20 }, (_, index) => {
    const action = ACTIONS[index % ACTIONS.length];
    return {
      id: index + 1,
      time: "2024-03-18 10:22:00",
      account: index === 2 ? "账号名未设置" : "sgs123123",
      accountSub: "10001_119239030",
      device: "DEV_X88",
      deviceSub: "iPhone 15 Pro (iOS 17.2)",
      ip: "192.168.1.0",
      ipSub: "浙江省杭州市（移动4G）",
      order: "393808819397226496",
      amount: "0.01 CNY",
      score: "91/100",
      action,
      muted: action === "验证码验证" || action === "放行",
      type,
      logType,
    };
  });
}

function renderEmpty() {
  return `
    <div class="empty-panel">
      <div class="empty-block">
        <div class="empty-icon" aria-hidden="true"></div>
        <div class="empty-shadow" aria-hidden="true"></div>
        <span>暂无数据</span>
      </div>
    </div>
  `;
}

function renderLogTabs() {
  const type = getModalType();
  const tabsHtml = TYPE_CONFIG[type].tabs.map((log) => `
    <button class="log-tab${state.logType === log ? " active" : ""}" type="button" data-log="${log}" role="tab" aria-selected="${state.logType === log}">
      ${LOG_LABELS[log]}
    </button>
  `).join("");
  return `
    <div class="log-head">
      <div class="log-tabs" role="tablist" aria-label="日志类型">${tabsHtml}</div>
      <button id="exportButton" class="export-button" type="button"><i class="ti ti-download"></i>导出详情</button>
    </div>
  `;
}

function renderTableFooter(logType) {
  const actionText = logType === "payment" ? "下单" : logType === "register" ? "注册" : "登录";
  return `
    <div class="table-footer">
      <span>近30日共发起${actionText}48次，其中高风险${actionText}30次</span>
      <div class="pager" aria-label="分页">
        <span class="muted">&lt;</span>
        <span>1</span>
        <span class="muted">...</span>
        <span>4</span>
        <span>5</span>
        <span class="current">6</span>
        <span>7</span>
        <span>8</span>
        <span class="muted">...</span>
        <span>50</span>
        <span>&gt;</span>
        <select id="pageSizeSelect" class="page-size" aria-label="每页条数">
          <option value="5"${state.pageSize === 5 ? " selected" : ""}>5条/页</option>
          <option value="10"${state.pageSize === 10 ? " selected" : ""}>10条/页</option>
          <option value="20"${state.pageSize === 20 ? " selected" : ""}>20条/页</option>
        </select>
      </div>
    </div>
  `;
}

function renderTableRows(rows, columns) {
  return rows.map((row) => `
    <tr>
      ${columns.map((column) => `<td${column.className ? ` class="${column.className}"` : ""}>${column.render(row)}</td>`).join("")}
    </tr>
  `).join("");
}

function renderLogTable() {
  if (state.empty) {
    return renderEmpty();
  }

  const type = getModalType();
  const rows = buildRows(type, state.logType).slice(0, state.pageSize);
  const timeLabel = state.logType === "payment" ? "下单时间" : state.logType === "register" ? "注册时间" : "登录时间";
  const accountCol = {
    title: "账号信息",
    render: (row) => `<span class="cell-main">${row.account}${copyButton("账号信息", row.account)}</span><span class="cell-sub">${row.accountSub}</span>`,
  };
  const deviceCol = {
    title: "设备信息",
    render: (row) => `<span class="cell-main">${row.device}${copyButton("设备ID", row.device)}</span><span class="cell-sub">${row.deviceSub}</span>`,
  };
  const ipCol = {
    title: "IP 信息",
    render: (row) => `<span class="cell-main">${row.ip}${copyButton("IP地址", row.ip)}</span><span class="cell-sub">${row.ipSub}</span>`,
  };
  const orderCol = {
    title: "下单信息",
    render: (row) => `<span class="cell-main">${row.order}${copyButton("订单号", row.order)}</span><span class="cell-sub">${row.amount}</span>`,
  };

  const columns = [
    { title: timeLabel, className: "time-cell", render: (row) => row.time },
  ];

  if (state.logType === "payment") {
    columns.push(orderCol);
  }
  if (type !== "account") {
    columns.push(accountCol);
  }
  if (type !== "device") {
    columns.push(deviceCol);
  }
  if (type !== "ip") {
    columns.push(ipCol);
  }
  columns.push(
    { title: "风险分", className: "log-score", render: (row) => row.score },
    { title: "处置动作", render: (row) => `<span class="status-dot${row.muted ? " gray" : ""}"></span>${row.action}` },
  );

  return `
    <table class="portrait-table columns-${columns.length}">
      <thead>
        <tr>${columns.map((column) => `<th>${column.title}</th>`).join("")}</tr>
      </thead>
      <tbody>${renderTableRows(rows, columns)}</tbody>
    </table>
    ${renderTableFooter(state.logType)}
  `;
}

function renderLogs() {
  return `
    <section class="portrait-section log-section">
      ${renderSectionTitle("日志信息")}
      ${renderLogTabs()}
      <div id="logTableArea" class="log-table-area">${renderLogTable()}</div>
    </section>
  `;
}

function relationData() {
  const type = getModalType();
  if (type === "account") {
    return {
      left: { title: "关联设备", count: "14台", kind: "device", label: "设备ID：", value: "dev1231293911111111...", sub: "mi 17 pro max" },
      right: { title: "关联IP", count: "14个", kind: "ip", label: "IP地址：", value: "192.168.1111.1111", sub: "中国 山东 济南" },
      center: "ti-users",
      summary: "近30日共关联设备14台，IP 14个",
    };
  }
  if (type === "device") {
    return {
      left: { title: "关联账号", count: "3个", kind: "account", label: "SDKID：", value: "2312939111111111...", sub: "账号名  sgs123" },
      right: { title: "关联IP", count: "14个", kind: "ip", label: "IP地址：", value: "192.168.1111.1111", sub: "中国 山东 济南" },
      center: "ti-device-desktop",
      summary: "近30日共关联账号14个，IP 14个",
    };
  }
  return {
    left: { title: "关联账号", count: "3个", kind: "account", label: "SDKID：", value: "2312939111111111...", sub: "账号名  sgs123" },
    right: { title: "关联设备", count: "14台", kind: "device", label: "设备ID：", value: "dev1231293911111111...", sub: "mi 17 pro max" },
    center: "ti-world",
    summary: "近30日共关联账号14个，设备14台",
  };
}

function renderRelationCard(card) {
  if (state.empty) {
    return `<div class="relation-card empty"><h3>${card.title} <span>${card.count}</span></h3><div class="relation-list">${renderEmpty()}</div></div>`;
  }
  const copyLabel = card.kind === "ip" ? "IP地址" : card.kind === "device" ? "设备ID" : "SDKID";
  return `
    <div class="relation-card">
      <h3>${card.title} <span>${card.count}</span></h3>
      <div class="relation-list">
        ${Array.from({ length: 3 }, () => `
          <div class="relation-item">
            <p><span>${card.label}</span>${card.value}${copyButton(copyLabel, card.value)}</p>
            <p class="relation-sub">${card.sub}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderRelations() {
  const data = relationData();
  return `
    <section class="portrait-section relation-section">
      ${renderSectionTitle("关联信息")}
      <div class="relation-map">
        ${renderRelationCard(data.left)}
        <div class="relation-center" aria-hidden="true"><i class="ti ${data.center}"></i></div>
        ${renderRelationCard(data.right)}
      </div>
      <div class="relation-summary">${data.summary}</div>
    </section>
  `;
}

function renderModalBody() {
  const type = getModalType();
  const queryValue = getModalValue();
  const info = type === "account" ? renderAccountInfo(queryValue) : type === "device" ? renderDeviceInfo(queryValue) : renderIpInfo(queryValue);
  modalTitle.textContent = TYPE_CONFIG[type].title;
  state.logType = TYPE_CONFIG[type].tabs.includes(state.logType) ? state.logType : "login";
  modalBody.innerHTML = `${info}${renderTags()}${renderLogs()}${renderRelations()}`;
  bindModalDynamicEvents();
}

function bindModalDynamicEvents() {
  const infoToggle = document.querySelector("#infoToggle");
  const infoDetails = document.querySelector("#infoDetails");
  const moreTags = document.querySelector("#moreTags");
  const pageSizeSelect = document.querySelector("#pageSizeSelect");
  const logTableArea = document.querySelector("#logTableArea");

  infoToggle?.addEventListener("click", () => {
    const expanded = infoToggle.getAttribute("aria-expanded") === "true";
    infoToggle.setAttribute("aria-expanded", String(!expanded));
    if (infoDetails) infoDetails.hidden = expanded;
  });

  moreTags?.addEventListener("click", () => {
    const tagWrap = document.querySelector("#tagWrap");
    tagWrap?.classList.remove("collapsed");
    tagWrap?.classList.add("expanded");
    moreTags.hidden = true;
  });

  document.querySelectorAll(".log-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.logType = tab.dataset.log;
      document.querySelectorAll(".log-tab").forEach((item) => {
        const selected = item === tab;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-selected", String(selected));
      });
      if (logTableArea) {
        logTableArea.innerHTML = renderLogTable();
        bindModalDynamicEvents();
      }
    });
  });

  pageSizeSelect?.addEventListener("change", () => {
    state.pageSize = Number(pageSizeSelect.value);
    if (logTableArea) {
      logTableArea.innerHTML = renderLogTable();
      bindModalDynamicEvents();
    }
  });

  document.querySelector("#exportButton")?.addEventListener("click", exportExcel);
}

function openModal(context = null) {
  state.modal = context;
  const value = getModalValue();
  state.empty = /空|empty|zero/.test(value.toLowerCase());
  state.pageSize = 5;
  state.logType = "login";
  renderModalBody();
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  state.modal = null;
}

function exportExcel() {
  const type = getModalType();
  const sheets = ["login", "register", "payment"].map((log) => {
    const rows = buildRows(type, log).slice(0, 20);
    const tableRows = rows.map((row) => `
      <tr>
        <td>${row.time}</td>
        <td>${row.account}</td>
        <td>${row.accountSub}</td>
        <td>${row.device}</td>
        <td>${row.deviceSub}</td>
        <td>${row.ip}</td>
        <td>${row.ipSub}</td>
        <td>${row.order}</td>
        <td>${row.amount}</td>
        <td>${row.score}</td>
        <td>${row.action}</td>
      </tr>
    `).join("");
    return `<h3>${LOG_LABELS[log]}</h3><table><tr><th>时间</th><th>账号</th><th>账号名</th><th>设备ID</th><th>设备型号</th><th>IP地址</th><th>归属地</th><th>订单号</th><th>金额</th><th>风险分</th><th>处置动作</th></tr>${tableRows}</table>`;
  }).join("");
  const blob = new Blob([`<html><meta charset="UTF-8"><body>${sheets}</body></html>`], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${TYPE_CONFIG[type].title}-导出详情.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("导出详情已生成");
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => applyType(tab.dataset.type));
});

fieldSelect.addEventListener("change", () => {
  state.fields[state.type] = fieldSelect.value;
  queryInput.placeholder = getPlaceholder();
});

queryInput.addEventListener("input", () => {
  state.values[state.type] = queryInput.value;
});

queryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = queryInput.value.trim();

  if (!value) {
    const message = `请输入${state.fields[state.type]}`;
    errorText.textContent = message;
    showToast(message);
    queryInput.focus();
    return;
  }
  if (/失败|error|fail/i.test(value)) {
    errorText.textContent = "";
    showToast("查询失败，请稍后重试");
    return;
  }

  errorText.textContent = "";
  queryButton.classList.add("loading");
  queryButton.textContent = "查询中";

  window.setTimeout(() => {
    queryButton.classList.remove("loading");
    queryButton.textContent = "立即查询";
    openModal();
  }, 260);
});

document.querySelectorAll(".history-tag").forEach((tag) => {
  tag.addEventListener("click", () => {
    errorText.textContent = "";
    openModal({
      type: tag.dataset.type,
      field: tag.dataset.field,
      value: tag.dataset.value,
    });
  });
});

document.querySelectorAll("[data-close-modal]").forEach((node) => {
  node.addEventListener("click", closeModal);
});

modal.addEventListener("click", (event) => {
  const button = event.target.closest(".copy-btn");
  if (!button) return;
  copyValue(button.dataset.copyLabel, button.dataset.copyValue);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("open")) {
    closeModal();
  }
});

applyType("account");
