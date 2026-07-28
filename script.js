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

const DIMENSION_CONFIG = {
  sdkId: { resultType: "account", field: "SDKID", placeholder: "输入 SDKID", hint: "请输入完整 SDKID；按 Enter 快速查询" },
  passportId: { resultType: "account", field: "通行证ID", placeholder: "输入通行证ID", hint: "请输入完整通行证ID，支持直接粘贴；按 Enter 快速查询" },
  accountName: { resultType: "account", field: "账号名", placeholder: "输入账号名", hint: "支持账号名精确查询；按 Enter 快速查询" },
  loginPhone: { resultType: "account", field: "登录手机", placeholder: "输入登录手机", hint: "支持带国家或地区区号的完整手机号；按 Enter 快速查询" },
  deviceId: { resultType: "device", field: "设备ID", placeholder: "输入设备ID", hint: "请输入完整设备ID；按 Enter 快速查询" },
  deviceFingerprint: { resultType: "device", field: "设备指纹", placeholder: "输入设备指纹", hint: "输入完整设备指纹，可查询关联账号；按 Enter 快速查询" },
  ipAddress: { resultType: "ip", field: "IP", placeholder: "输入 IPv4 或 IPv6 地址", hint: "支持 IPv4 和 IPv6 地址；按 Enter 快速查询" },
};

const LOG_LABELS = {
  login: "登录",
  register: "注册",
  payment: "支付",
};

const ACTIONS = ["验证码验证", "验证码验证通过", "滑块验证", "滑块验证通过", "放行", "拦截"];

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function formatDate(date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDefaultLogRange() {
  const end = new Date();
  const start = addDays(end, -29);
  return {
    start: formatDate(start),
    end: formatDate(end),
  };
}

const state = {
  dimension: "sdkId",
  type: "account",
  values: {
    sdkId: "",
    passportId: "",
    accountName: "",
    loginPhone: "",
    deviceId: "",
    deviceFingerprint: "",
    ipAddress: "",
  },
  fields: {
    account: "账号名",
    device: "设备ID",
    ip: "IP",
  },
  logType: "login",
  page: 1,
  pageSize: 5,
  logRange: getDefaultLogRange(),
  datePickerOpen: false,
  dateSelecting: "start",
  pickerMonth: null,
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
const queryButtonLabel = document.querySelector(".query-button-label");
const queryClear = document.querySelector("#queryClear");
const modal = document.querySelector("#resultModal");
const modalTitle = document.querySelector("#modalTitle");
const modalBody = document.querySelector(".modal-body");
const toast = document.querySelector("#toast");

let toastTimer;
let lastFocusedElement = null;

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

function updateClearButton() {
  queryClear.classList.toggle("visible", Boolean(queryInput.value));
}

function setQueryError(message = "") {
  errorText.textContent = message;
  queryForm.classList.toggle("has-error", Boolean(message));
  document.querySelector("#queryHelp").hidden = Boolean(message);
}

function applyDimension(dimension, preferredField) {
  state.values[state.dimension] = queryInput.value;
  const dimensionConfig = DIMENSION_CONFIG[dimension];
  state.dimension = dimension;
  state.type = dimensionConfig.resultType;
  state.fields[state.type] = preferredField || dimensionConfig.field;

  tabs.forEach((tab) => {
    const selected = tab.dataset.dimension === dimension;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });

  renderFieldOptions(state.type, state.fields[state.type]);
  queryInput.value = state.values[dimension] || "";
  queryInput.placeholder = dimensionConfig.placeholder;
  queryInput.setAttribute("aria-label", dimensionConfig.placeholder);
  hintText.textContent = dimensionConfig.hint;
  setQueryError();
  updateClearButton();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function copyButton(label, value) {
  return `<button class="copy-btn" type="button" data-copy-label="${label}" data-copy-value="${value}" aria-label="复制${label}" title="复制${label}"><i class="ti ti-copy"></i></button>`;
}

async function copyValue(label, value) {
  let copied = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value || "");
      copied = true;
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = value || "";
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      copied = document.execCommand("copy");
      textarea.remove();
    }
  } catch (error) {
    copied = false;
  }
  showToast(copied ? `${label}已复制` : "复制失败，请手动复制");
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
      <strong title="${value}">${value}</strong>
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
      ${renderSectionTitle("基础信息", { toggle: true, expanded: true })}
      <div class="info-card">
        <div class="account-summary">
          <div class="summary-cell"><span>SDKID：</span><strong title="${sdk}">${sdk}</strong>${copyButton("SDKID", sdk)}</div>
          <div class="summary-cell"><span>通行证ID：</span><strong title="${passport}">${passport}</strong>${copyButton("通行证ID", passport)}</div>
          <div class="summary-cell"><span>账号名：</span><strong title="${account}">${account}</strong>${copyButton("账号名", account)}</div>
        </div>
        <div id="infoDetails" class="account-details">
          <div class="detail-group">
            ${renderFieldRow("登录手机", "152****9728", true)}
            ${renderFieldRow("安全手机", "152****9728", true)}
            ${renderFieldRow("安全邮箱", "67**32@qq.com", true)}
            ${renderFieldRow("实名认证", "已成年", true)}
          </div>
          <div class="detail-group">
            ${renderFieldRow("登录时间", "2026-07-20 18:33:22")}
            ${renderFieldRow("登录IP", "192.186.137.10(上海)", true)}
            ${renderFieldRow("登录设备ID", "de12381218...", true)}
            ${renderFieldRow("登录方式", "账密登录")}
          </div>
          <div class="detail-group">
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
          <div class="summary-cell"><span>设备ID：</span><strong title="${deviceId}">${deviceId}</strong>${copyButton("设备ID", deviceId)}</div>
          <div class="summary-cell"><span>设备指纹：</span><strong title="${finger}">${finger}</strong>${copyButton("设备指纹", finger)}</div>
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
          <div class="summary-cell"><span>IP地址</span><strong title="${ip}">${ip}</strong>${copyButton("IP地址", ip)}</div>
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
  return Array.from({ length: 48 }, (_, index) => {
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
      amount: "¥648.00",
      score: 91,
      action,
      type,
      logType,
    };
  });
}

function getRiskClass(score) {
  if (score >= 90) return "risk-critical";
  if (score >= 70) return "risk-high";
  if (score >= 40) return "risk-medium";
  return "risk-low";
}

function getActionClass(action) {
  if (action === "拦截") return "action-danger";
  if (["放行", "验证码验证通过", "滑块验证通过"].includes(action)) return "action-success";
  return "action-warning";
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
    <button class="log-tab${state.logType === log ? " active" : ""}" type="button" data-log="${log}" role="tab" aria-selected="${state.logType === log}" tabindex="${state.logType === log ? 0 : -1}">
      ${LOG_LABELS[log]}
    </button>
  `).join("");
  return `
    <div class="log-head">
      <div class="log-tabs" role="tablist" aria-label="日志类型">${tabsHtml}</div>
      <div class="log-actions">
        <div class="date-range-wrap">
          <button id="logDateRange" class="date-range-button" type="button" aria-haspopup="dialog" aria-expanded="${state.datePickerOpen}">
            <span>${state.logRange.start}</span>
            <span class="date-range-separator">→</span>
            <span>${state.logRange.end}</span>
            <i class="ti ti-calendar" aria-hidden="true"></i>
          </button>
          ${state.datePickerOpen ? renderDatePickerDropdown() : ""}
        </div>
        <button id="exportButton" class="export-button" type="button"${state.empty ? " disabled" : ""}><i class="ti ti-download"></i>导出详情</button>
      </div>
    </div>
  `;
}
function getRangeDays() {
  const start = parseDate(state.logRange.start);
  const end = parseDate(state.logRange.end);
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

function renderDatePickerDropdown() {
  const base = state.pickerMonth ? parseDate(`${state.pickerMonth}-01`) : parseDate(state.logRange.end);
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1);
  const gridStart = addDays(first, -((first.getDay() + 6) % 7));
  const today = formatDate(new Date());
  const start = parseDate(state.logRange.start);
  const end = parseDate(state.logRange.end);
  const monthLabel = base.toLocaleString("en-US", { month: "short" });
  const rows = Array.from({ length: 6 }, (_, rowIndex) => {
    const cells = Array.from({ length: 7 }, (_, colIndex) => {
      const date = addDays(gridStart, rowIndex * 7 + colIndex);
      const value = formatDate(date);
      const inView = date.getMonth() === month;
      const isStart = value === state.logRange.start;
      const isEnd = value === state.logRange.end;
      const inRange = date >= start && date <= end;
      const isFuture = date > parseDate(today);
      const classes = [
        "picker-day",
        inView ? "" : "out-month",
        value === today ? "today" : "",
        isStart ? "range-start" : "",
        isEnd ? "range-end" : "",
        inRange ? "in-range" : "",
        isFuture ? "future" : "",
      ].filter(Boolean).join(" ");
      return `<button class="${classes}" type="button" data-date="${value}"${isFuture ? " disabled" : ""}>${date.getDate()}</button>`;
    }).join("");
    return `<div class="picker-row">${cells}</div>`;
  }).join("");

  return `
    <div id="logDatePicker" class="date-picker-dropdown" role="dialog" aria-label="日期范围选择">
      <div class="picker-arrow" aria-hidden="true"></div>
      <div class="picker-header">
        <button class="picker-nav" type="button" data-picker-nav="-12" aria-label="上一年">«</button>
        <button class="picker-nav" type="button" data-picker-nav="-1" aria-label="上一月">‹</button>
        <div class="picker-title"><span>${monthLabel}</span><span>${year}</span></div>
        <button class="picker-nav" type="button" data-picker-nav="1" aria-label="下一月">›</button>
        <button class="picker-nav" type="button" data-picker-nav="12" aria-label="下一年">»</button>
      </div>
      <div class="picker-body">
        <div class="picker-week"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
        ${rows}
      </div>
      <button id="pickerToday" class="picker-today" type="button">Today</button>
    </div>
  `;
}

function renderTableFooter(logType) {
  const total = 48;
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
  state.page = Math.min(Math.max(1, state.page), totalPages);
  const actionText = logType === "payment" ? "下单" : logType === "register" ? "注册" : "登录";
  const pageSet = new Set([1, totalPages, state.page - 1, state.page, state.page + 1]);
  const pages = Array.from(pageSet).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  let previous = 0;
  const pageItems = pages.map((page) => {
    const gap = previous && page - previous > 1 ? '<span class="pager-ellipsis">…</span>' : "";
    previous = page;
    return `${gap}<button class="page-button${page === state.page ? " current" : ""}" type="button" data-page="${page}" aria-current="${page === state.page ? "page" : "false"}">${page}</button>`;
  }).join("");
  return `
    <div class="table-footer">
      <span>近${getRangeDays()}日共发起${actionText}${total}次，其中高风险${actionText}30次</span>
      <div class="pager" aria-label="分页">
        <select id="pageSizeSelect" class="page-size" aria-label="每页条数">
          <option value="5"${state.pageSize === 5 ? " selected" : ""}>5条/页</option>
          <option value="10"${state.pageSize === 10 ? " selected" : ""}>10条/页</option>
          <option value="20"${state.pageSize === 20 ? " selected" : ""}>20条/页</option>
        </select>
        <button class="page-button page-nav" type="button" data-page-delta="-1" aria-label="上一页"${state.page === 1 ? " disabled" : ""}>‹</button>
        ${pageItems}
        <button class="page-button page-nav" type="button" data-page-delta="1" aria-label="下一页"${state.page === totalPages ? " disabled" : ""}>›</button>
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
  const allRows = buildRows(type, state.logType);
  const startIndex = (state.page - 1) * state.pageSize;
  const rows = allRows.slice(startIndex, startIndex + state.pageSize);
  const timeLabel = state.logType === "payment" ? "下单时间" : state.logType === "register" ? "注册时间" : "登录时间";
  const accountCol = {
    title: "账号信息",
    render: (row) => `<span class="cell-main"><span class="cell-value" title="${row.account}">${row.account}</span>${copyButton("账号信息", row.account)}</span><span class="cell-sub" title="${row.accountSub}">${row.accountSub}</span>`,
  };
  const deviceCol = {
    title: "设备信息",
    render: (row) => `<span class="cell-main"><span class="cell-value" title="${row.device}">${row.device}</span>${copyButton("设备ID", row.device)}</span><span class="cell-sub" title="${row.deviceSub}">${row.deviceSub}</span>`,
  };
  const ipCol = {
    title: "IP 信息",
    render: (row) => `<span class="cell-main"><span class="cell-value" title="${row.ip}">${row.ip}</span>${copyButton("IP地址", row.ip)}</span><span class="cell-sub" title="${row.ipSub}">${row.ipSub}</span>`,
  };
  const orderCol = {
    title: "下单信息",
    render: (row) => `<span class="cell-main"><span class="cell-value" title="${row.order}">订单号：${row.order}</span>${copyButton("订单号", row.order)}</span><span class="cell-sub">金额：${row.amount}</span>`,
  };

  const columns = [
    { title: timeLabel, className: "time-cell", render: (row) => `<span title="${row.time}">${row.time}</span>` },
  ];

  if (state.logType === "payment") columns.push(orderCol);
  if (type !== "account") columns.push(accountCol);
  if (type !== "device") columns.push(deviceCol);
  if (type !== "ip") columns.push(ipCol);
  columns.push(
    { title: "风险分", className: "log-score", render: (row) => `<span class="risk-score ${getRiskClass(row.score)}">${row.score}/100</span>` },
    { title: "处置动作", render: (row) => `<span class="action-state ${getActionClass(row.action)}"><span class="status-dot" aria-hidden="true"></span>${row.action}</span>` },
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
    return `<div class="relation-card empty" data-kind="${card.kind}"><h3>${card.title} <span>${card.count}</span></h3><div class="relation-list">${renderEmpty()}</div></div>`;
  }
  const copyLabel = card.kind === "ip" ? "IP地址" : card.kind === "device" ? "设备ID" : "SDKID";
  const total = Number.parseInt(card.count, 10) || 5;
  const headers = card.kind === "ip" ? ["IP地址", "归属地", "关联次数"] : card.kind === "device" ? ["设备ID", "设备型号", "关联次数"] : ["SDKID", "账号名", "关联次数"];
  const subValue = card.kind === "account" ? card.sub.replace(/^账号名\s*/, "") : card.sub;
  const rows = Array.from({ length: total }, (_, index) => `
    <div class="relation-row relation-item${index >= 5 ? " is-extra" : ""}" role="row">
      <span class="relation-primary" role="cell"><span class="relation-value" title="${card.value}">${card.value}</span>${copyButton(copyLabel, card.value)}</span>
      <span class="relation-secondary" role="cell" title="${subValue}">${subValue}</span>
      <span class="relation-count" role="cell">${total - index}</span>
    </div>
  `).join("");
  return `
    <div class="relation-card" data-kind="${card.kind}">
      <h3>${card.title} <span>${card.count}</span></h3>
      <div class="relation-list" role="table" aria-label="${card.title}">
        <div class="relation-row relation-table-head" role="row">${headers.map((header) => `<span role="columnheader">${header}</span>`).join("")}</div>
        ${rows}
      </div>
      ${total > 5 ? `<button class="relation-more" type="button" data-relation-toggle>查看更多 &gt;</button>` : ""}
    </div>
  `;
}
function renderRelations() {
  const data = relationData();
  return `
    <section class="portrait-section relation-section">
      ${renderSectionTitle("关联信息")}
      <div class="relation-grid">
        ${renderRelationCard(data.left)}
        ${renderRelationCard(data.right)}
      </div>
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
  const logSection = document.querySelector(".log-section");
  const dateRangeButton = document.querySelector("#logDateRange");

  function refreshLogSection() {
    if (logSection) {
      logSection.outerHTML = renderLogs();
      bindModalDynamicEvents();
    }
  }

  function refreshLogTable() {
    const currentArea = document.querySelector("#logTableArea");
    if (currentArea) {
      currentArea.innerHTML = renderLogTable();
      bindModalDynamicEvents();
    }
  }

  if (infoToggle?.dataset.bound !== "true") {
    infoToggle.dataset.bound = "true";
    infoToggle.addEventListener("click", () => {
      const expanded = infoToggle.getAttribute("aria-expanded") === "true";
      infoToggle.setAttribute("aria-expanded", String(!expanded));
      if (infoDetails) infoDetails.hidden = expanded;
    });
  }

  if (moreTags?.dataset.bound !== "true") {
    moreTags.dataset.bound = "true";
    moreTags.addEventListener("click", () => {
      const tagWrap = document.querySelector("#tagWrap");
      const expanded = tagWrap?.classList.toggle("expanded") || false;
      tagWrap?.classList.toggle("collapsed", !expanded);
      moreTags.textContent = expanded ? "收起 <" : "查看更多 >";
    });
  }

  document.querySelectorAll(".log-tab").forEach((tab, index, tabList) => {
    if (tab.dataset.bound === "true") return;
    tab.dataset.bound = "true";
    const activateTab = () => {
      state.logType = tab.dataset.log;
      state.page = 1;
      state.datePickerOpen = false;
      refreshLogSection();
    };
    tab.addEventListener("click", activateTab);
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = tabList[(index + direction + tabList.length) % tabList.length];
      state.logType = next.dataset.log;
      state.page = 1;
      refreshLogSection();
      window.requestAnimationFrame(() => document.querySelector(`.log-tab[data-log="${state.logType}"]`)?.focus());
    });
  });

  if (dateRangeButton?.dataset.bound !== "true") {
    dateRangeButton.dataset.bound = "true";
    dateRangeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      state.datePickerOpen = !state.datePickerOpen;
      state.pickerMonth = state.pickerMonth || state.logRange.end.slice(0, 7);
      refreshLogSection();
    });
  }

  document.querySelectorAll(".picker-nav").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const current = state.pickerMonth ? parseDate(`${state.pickerMonth}-01`) : parseDate(state.logRange.end);
      current.setMonth(current.getMonth() + Number(button.dataset.pickerNav));
      state.pickerMonth = formatDate(current).slice(0, 7);
      state.datePickerOpen = true;
      refreshLogSection();
    });
  });

  document.querySelectorAll(".picker-day:not(:disabled)").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const selected = button.dataset.date;
      if (state.dateSelecting === "start") {
        state.logRange.start = selected;
        if (parseDate(selected) > parseDate(state.logRange.end)) state.logRange.end = selected;
        state.dateSelecting = "end";
        state.datePickerOpen = true;
        showToast("请选择结束日期");
      } else {
        const start = parseDate(state.logRange.start);
        const end = parseDate(selected);
        const nextRange = end < start ? { start: selected, end: state.logRange.start } : { start: state.logRange.start, end: selected };
        const days = Math.round((parseDate(nextRange.end) - parseDate(nextRange.start)) / 86400000) + 1;
        if (days > 30) {
          showToast("最多可查询连续 30 天的日志");
          state.datePickerOpen = true;
          refreshLogSection();
          return;
        }
        state.logRange = nextRange;
        state.page = 1;
        state.dateSelecting = "start";
        state.datePickerOpen = false;
      }
      state.pickerMonth = selected.slice(0, 7);
      refreshLogSection();
    });
  });

  document.querySelector("#pickerToday")?.addEventListener("click", (event) => {
    event.stopPropagation();
    state.logRange = getDefaultLogRange();
    state.page = 1;
    state.dateSelecting = "start";
    state.datePickerOpen = false;
    state.pickerMonth = state.logRange.end.slice(0, 7);
    refreshLogSection();
  });

  pageSizeSelect?.addEventListener("change", () => {
    state.pageSize = Number(pageSizeSelect.value);
    state.page = 1;
    refreshLogTable();
  });

  document.querySelectorAll(".page-button[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      state.page = Number(button.dataset.page);
      refreshLogTable();
    });
  });

  document.querySelectorAll(".page-button[data-page-delta]").forEach((button) => {
    button.addEventListener("click", () => {
      state.page += Number(button.dataset.pageDelta);
      refreshLogTable();
    });
  });

  document.querySelectorAll("[data-relation-toggle]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", () => {
      const card = button.closest(".relation-card");
      const expanded = card?.classList.toggle("expanded") || false;
      button.textContent = expanded ? "收起 <" : "查看更多 >";
    });
  });

  const exportButton = document.querySelector("#exportButton");
  if (exportButton && exportButton.dataset.bound !== "true") {
    exportButton.dataset.bound = "true";
    exportButton.addEventListener("click", exportExcel);
  }
}
function openModal(context = null) {
  lastFocusedElement = document.activeElement;
  state.modal = context;
  const value = getModalValue();
  state.empty = /空|empty|zero/.test(value.toLowerCase());
  state.page = 1;
  state.pageSize = 5;
  state.logType = "login";
  state.logRange = getDefaultLogRange();
  state.datePickerOpen = false;
  state.dateSelecting = "start";
  state.pickerMonth = state.logRange.end.slice(0, 7);
  renderModalBody();
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  window.requestAnimationFrame(() => modal.querySelector(".modal-close")?.focus());
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  state.modal = null;
  if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
  lastFocusedElement = null;
}
function exportExcel() {
  if (state.empty) return;
  const type = getModalType();
  const log = state.logType;
  const rows = buildRows(type, log);
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
  const sheet = `<h3>${LOG_LABELS[log]}日志</h3><table><tr><th>时间</th><th>账号</th><th>账号名</th><th>设备ID</th><th>设备型号</th><th>IP地址</th><th>归属地</th><th>订单号</th><th>金额</th><th>风险分</th><th>处置动作</th></tr>${tableRows}</table>`;
  const blob = new Blob([`<html><meta charset="UTF-8"><body>${sheet}</body></html>`], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${TYPE_CONFIG[type].title}_${LOG_LABELS[log]}日志_${state.logRange.start}_${state.logRange.end}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("导出详情已生成");
}
function validateQueryValue(value) {
  if (["sdkId", "passportId"].includes(state.dimension) && !/^[A-Za-z0-9_-]{3,64}$/.test(value)) return `${DIMENSION_CONFIG[state.dimension].field}格式不正确`;
  if (["deviceId", "deviceFingerprint"].includes(state.dimension) && value.length < 4) return `${DIMENSION_CONFIG[state.dimension].field}格式不正确`;
  if (state.dimension === "ipAddress") {
    const ipv4 = value.split(".");
    const validIpv4 = ipv4.length === 4 && ipv4.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
    const validIpv6 = value.includes(":") && /^[0-9A-Fa-f:]+$/.test(value);
    if (!validIpv4 && !validIpv6) return "IP 地址格式不正确";
  }
  if (state.dimension === "loginPhone" && !/^\+?[0-9\s-]{7,20}$/.test(value)) return "登录手机格式不正确";
  return "";
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => applyDimension(tab.dataset.dimension));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = tabs.indexOf(tab);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextTab = tabs[(currentIndex + direction + tabs.length) % tabs.length];
    applyDimension(nextTab.dataset.dimension);
    nextTab.focus();
  });
});

fieldSelect.addEventListener("change", () => {
  state.fields[state.type] = fieldSelect.value;
  queryInput.placeholder = getPlaceholder();
});

queryInput.addEventListener("input", () => {
  state.values[state.dimension] = queryInput.value;
  setQueryError();
  updateClearButton();
});

queryInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || queryButton.classList.contains("loading")) return;
  event.preventDefault();
  queryForm.requestSubmit();
});

queryClear.addEventListener("click", () => {
  queryInput.value = "";
  state.values[state.dimension] = "";
  setQueryError();
  updateClearButton();
  queryInput.focus();
});

queryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = queryInput.value.trim();

  if (!value) {
    const message = "请输入查询内容";
    setQueryError(message);
    showToast(message);
    queryInput.focus();
    return;
  }
  if (/失败|error|fail/i.test(value)) {
    setQueryError("查询失败，请稍后重试");
    showToast("查询失败，请稍后重试");
    return;
  }

  const validationError = validateQueryValue(value);
  if (validationError) {
    setQueryError(validationError);
    showToast(validationError);
    queryInput.focus();
    return;
  }

  setQueryError();
  queryButton.classList.add("loading");
  queryButton.setAttribute("aria-busy", "true");
  queryButtonLabel.textContent = "查询中";

  window.setTimeout(() => {
    queryButton.classList.remove("loading");
    queryButton.setAttribute("aria-busy", "false");
    queryButtonLabel.textContent = "开始查询";
    openModal();
  }, 260);
});

document.querySelectorAll(".history-tag").forEach((tag) => {
  tag.addEventListener("click", () => {
    setQueryError();
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
  if (!modal.classList.contains("open")) return;
  if (event.key === "Escape") {
    closeModal();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = Array.from(modal.querySelectorAll('button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'))
    .filter((element) => !element.hidden && element.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
applyDimension("sdkId");
