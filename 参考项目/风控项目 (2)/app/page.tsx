"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type SearchDimension = "账号" | "用户 ID" | "设备指纹" | "IP 地址" | "手机号";
type RiskMode = "登录风险" | "支付风险";

type RiskLog = {
  id: string;
  time: string;
  event: string;
  detail: string;
  location: string;
  result: string;
  level: "高风险" | "中风险" | "低风险";
  evidence: string[];
};

type RelationNode = {
  id: string;
  short: string;
  title: string;
  subtitle: string;
  type: "设备" | "IP" | "手机号" | "支付工具";
  risk: "high" | "medium" | "normal";
  position: string;
  firstSeen: string;
  lastSeen: string;
  events: number;
};

const dimensions: SearchDimension[] = [
  "账号",
  "用户 ID",
  "设备指纹",
  "IP 地址",
  "手机号",
];

const dimensionPlaceholder: Record<SearchDimension, string> = {
  账号: "输入账号、邮箱或用户名",
  "用户 ID": "输入 UID，如 184027391",
  设备指纹: "输入设备指纹，如 DF-9A72-41C8",
  "IP 地址": "输入 IPv4 或 IPv6 地址",
  手机号: "输入完整手机号",
};

const recentSearches = [
  { dimension: "账号" as SearchDimension, value: "alex.chen@example.com" },
  { dimension: "用户 ID" as SearchDimension, value: "184027391" },
  { dimension: "设备指纹" as SearchDimension, value: "DF-9A72-41C8" },
];

const loginLogs: RiskLog[] = [
  {
    id: "LG-20260728-091834",
    time: "07-28 09:18:34",
    event: "异地设备登录",
    detail: "新设备首次登录，距离常用地 1,126 km",
    location: "中国 · 成都",
    result: "二次验证通过",
    level: "高风险",
    evidence: ["首次出现设备", "地理跃迁", "代理网络"],
  },
  {
    id: "LG-20260727-224102",
    time: "07-27 22:41:02",
    event: "密码连续试错",
    detail: "11 分钟内密码失败 7 次，随后登录成功",
    location: "中国 · 上海",
    result: "登录成功",
    level: "中风险",
    evidence: ["短时高频", "密码试错"],
  },
  {
    id: "LG-20260727-081621",
    time: "07-27 08:16:21",
    event: "常用设备登录",
    detail: "iPhone 15 Pro · iOS 18.5",
    location: "中国 · 上海",
    result: "登录成功",
    level: "低风险",
    evidence: ["可信设备", "常用网络"],
  },
  {
    id: "LG-20260724-035708",
    time: "07-24 03:57:08",
    event: "夜间敏感操作",
    detail: "登录后 3 分钟内修改收款手机号",
    location: "中国 · 杭州",
    result: "操作已拦截",
    level: "高风险",
    evidence: ["非常用时段", "敏感资料变更"],
  },
];

const paymentLogs: RiskLog[] = [
  {
    id: "PY-20260728-103221",
    time: "07-28 10:32:21",
    event: "高频小额支付",
    detail: "8 分钟内向 4 个新商户发起 12 笔交易",
    location: "中国 · 成都",
    result: "交易已拦截",
    level: "高风险",
    evidence: ["新收款方", "高频交易", "设备异常"],
  },
  {
    id: "PY-20260727-211337",
    time: "07-27 21:13:37",
    event: "新增银行卡",
    detail: "绑定银行卡尾号 4821，持卡人姓名一致",
    location: "中国 · 上海",
    result: "延迟生效",
    level: "中风险",
    evidence: ["新支付工具", "登录后新增"],
  },
  {
    id: "PY-20260726-184906",
    time: "07-26 18:49:06",
    event: "跨境数字商品",
    detail: "向海外数字商品商户支付 ¥2,399.00",
    location: "新加坡",
    result: "人工审核通过",
    level: "中风险",
    evidence: ["跨境交易", "数字商品"],
  },
  {
    id: "PY-20260725-121124",
    time: "07-25 12:11:24",
    event: "常规消费",
    detail: "线下餐饮商户支付 ¥126.00",
    location: "中国 · 上海",
    result: "交易成功",
    level: "低风险",
    evidence: ["历史商户", "常用设备"],
  },
];

const relationNodes: RelationNode[] = [
  {
    id: "device-main",
    short: "D1",
    title: "iPhone 15 Pro",
    subtitle: "DF-8B19-2F0A",
    type: "设备",
    risk: "normal",
    position: "node-1",
    firstSeen: "2025-11-18",
    lastSeen: "2026-07-28 08:16",
    events: 186,
  },
  {
    id: "device-risk",
    short: "D2",
    title: "Chrome · Windows",
    subtitle: "DF-9A72-41C8",
    type: "设备",
    risk: "high",
    position: "node-2",
    firstSeen: "2026-07-28",
    lastSeen: "2026-07-28 10:32",
    events: 14,
  },
  {
    id: "ip-risk",
    short: "IP",
    title: "103.117.68.24",
    subtitle: "数据中心代理",
    type: "IP",
    risk: "high",
    position: "node-3",
    firstSeen: "2026-07-28",
    lastSeen: "2026-07-28 10:34",
    events: 26,
  },
  {
    id: "ip-usual",
    short: "IP",
    title: "180.167.43.91",
    subtitle: "上海 · 家庭宽带",
    type: "IP",
    risk: "normal",
    position: "node-4",
    firstSeen: "2025-11-18",
    lastSeen: "2026-07-27 22:41",
    events: 142,
  },
  {
    id: "phone",
    short: "M",
    title: "138****6028",
    subtitle: "中国移动 · 已实名",
    type: "手机号",
    risk: "normal",
    position: "node-5",
    firstSeen: "2025-11-18",
    lastSeen: "2026-07-24 03:57",
    events: 32,
  },
  {
    id: "card",
    short: "C",
    title: "银行卡 · 4821",
    subtitle: "新增支付工具",
    type: "支付工具",
    risk: "medium",
    position: "node-6",
    firstSeen: "2026-07-27",
    lastSeen: "2026-07-28 10:32",
    events: 5,
  },
];

const navItems = [
  { key: "overview", label: "风险概览", glyph: "OV" },
  { key: "profile", label: "用户风险画像", glyph: "UP" },
  { key: "strategy", label: "规则策略", glyph: "RS" },
  { key: "events", label: "事件中心", glyph: "EC", count: 12 },
  { key: "actions", label: "处置记录", glyph: "AR" },
  { key: "settings", label: "系统管理", glyph: "SM" },
];

function StatusDot({ tone }: { tone: "danger" | "warning" | "safe" }) {
  return <span className={`status-dot ${tone}`} aria-hidden="true" />;
}

function RiskBadge({ level }: { level: RiskLog["level"] }) {
  const tone =
    level === "高风险" ? "danger" : level === "中风险" ? "warning" : "safe";
  return (
    <span className={`risk-badge ${tone}`}>
      <StatusDot tone={tone} />
      {level}
    </span>
  );
}

function AppSidebar({
  onUnavailable,
}: {
  onUnavailable: (label: string) => void;
}) {
  return (
    <aside className="sidebar" aria-label="主导航">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          R
        </span>
        <span className="brand-copy">
          <strong>RiskOS</strong>
          <small>智能风控平台</small>
        </span>
      </div>
      <nav className="nav-list">
        <p className="nav-section">工作台</p>
        {navItems.slice(0, 5).map((item) => (
          <button
            className={`nav-item ${item.key === "profile" ? "active" : ""}`}
            key={item.key}
            type="button"
            aria-current={item.key === "profile" ? "page" : undefined}
            onClick={() =>
              item.key !== "profile" ? onUnavailable(item.label) : undefined
            }
          >
            <span className="nav-glyph" aria-hidden="true">
              {item.glyph}
            </span>
            <span>{item.label}</span>
            {item.count ? <span className="nav-count">{item.count}</span> : null}
          </button>
        ))}
        <p className="nav-section nav-section-system">系统</p>
        <button
          className="nav-item"
          type="button"
          onClick={() => onUnavailable("系统管理")}
        >
          <span className="nav-glyph" aria-hidden="true">
            SM
          </span>
          <span>系统管理</span>
        </button>
      </nav>
      <div className="sidebar-user">
        <span className="avatar small">林</span>
        <span className="user-copy">
          <strong>林墨</strong>
          <small>风控分析师</small>
        </span>
        <button
          type="button"
          className="more-button"
          aria-label="打开个人菜单"
          onClick={() => onUnavailable("个人菜单")}
        >
          •••
        </button>
      </div>
    </aside>
  );
}

function DimensionSelector({
  value,
  onChange,
  compact = false,
}: {
  value: SearchDimension;
  onChange: (value: SearchDimension) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <label className="dimension-select-wrap">
        <span className="sr-only">查询维度</span>
        <select
          className="dimension-select"
          value={value}
          onChange={(event) => onChange(event.target.value as SearchDimension)}
          aria-label="查询维度"
        >
          {dimensions.map((item) => (
            <option value={item} key={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="dimension-tabs" role="tablist" aria-label="查询维度">
      {dimensions.map((item) => (
        <button
          type="button"
          role="tab"
          aria-selected={value === item}
          className={value === item ? "selected" : ""}
          onClick={() => onChange(item)}
          key={item}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function TopUtilities({
  onUnavailable,
}: {
  onUnavailable: (label: string) => void;
}) {
  return (
    <div className="top-utilities">
      <span className="environment">
        <span className="environment-dot" />
        生产环境
      </span>
      <button
        type="button"
        className="utility-button"
        aria-label="帮助中心"
        onClick={() => onUnavailable("帮助中心")}
      >
        ?
      </button>
      <button
        type="button"
        className="utility-button notification-button"
        aria-label="通知，2 条未读"
        onClick={() => onUnavailable("通知中心")}
      >
        <span aria-hidden="true">N</span>
        <span className="notification-dot" />
      </button>
      <span className="avatar">林</span>
    </div>
  );
}

function SearchHome({
  dimension,
  setDimension,
  query,
  setQuery,
  onSearch,
  loading,
  error,
  onRecent,
  onUnavailable,
}: {
  dimension: SearchDimension;
  setDimension: (value: SearchDimension) => void;
  query: string;
  setQuery: (value: string) => void;
  onSearch: (event?: FormEvent) => void;
  loading: boolean;
  error: string;
  onRecent: (dimension: SearchDimension, value: string) => void;
  onUnavailable: (label: string) => void;
}) {
  return (
    <main className="home-main" id="main-content">
      <header className="home-header">
        <div>
          <p className="eyebrow">风险调查</p>
          <h1>用户风险画像</h1>
        </div>
        <TopUtilities onUnavailable={onUnavailable} />
      </header>

      <section className="search-hero" aria-labelledby="search-title">
        <div className="hero-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="hero-mark" aria-hidden="true">
          <span className="hero-mark-ring" />
          <span className="hero-mark-core">R</span>
        </div>
        <p className="hero-kicker">Risk Intelligence</p>
        <h2 id="search-title">查询用户风险画像</h2>
        <p className="hero-description">
          从任一线索出发，聚合账号、设备与网络关系，快速定位风险证据。
        </p>

        <form className="search-panel" onSubmit={onSearch} noValidate>
          <DimensionSelector value={dimension} onChange={setDimension} />
          <div className={`home-search-box ${error ? "has-error" : ""}`}>
            <span className="search-icon" aria-hidden="true" />
            <label htmlFor="risk-query" className="sr-only">
              {dimension}查询内容
            </label>
            <input
              id="risk-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={dimensionPlaceholder[dimension]}
              autoComplete="off"
              aria-describedby={error ? "query-error" : "query-hint"}
              aria-invalid={Boolean(error)}
              autoFocus
            />
            {query ? (
              <button
                className="clear-button"
                type="button"
                onClick={() => setQuery("")}
                aria-label="清空查询内容"
              >
                ×
              </button>
            ) : null}
            <button className="primary-search-button" type="submit" disabled={loading}>
              {loading ? <span className="button-spinner" /> : null}
              {loading ? "正在聚合" : "开始查询"}
            </button>
          </div>
          <p
            className={error ? "search-error" : "search-helper"}
            id={error ? "query-error" : "query-hint"}
            role={error ? "alert" : undefined}
          >
            {error || "支持精确匹配；按 Enter 快速查询"}
          </p>
        </form>

        <div className="recent-block">
          <span>最近查询</span>
          <div className="recent-list">
            {recentSearches.map((item) => (
              <button
                type="button"
                key={`${item.dimension}-${item.value}`}
                onClick={() => onRecent(item.dimension, item.value)}
              >
                <span>{item.dimension}</span>
                {item.value}
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <span>数据更新于 2026-07-28 10:36:08</span>
        <span>全链路审计已开启</span>
      </footer>
    </main>
  );
}

function SummaryHeader({
  dimension,
  setDimension,
  query,
  setQuery,
  onSearch,
  loading,
  onBack,
  onUnavailable,
}: {
  dimension: SearchDimension;
  setDimension: (value: SearchDimension) => void;
  query: string;
  setQuery: (value: string) => void;
  onSearch: (event?: FormEvent) => void;
  loading: boolean;
  onBack: () => void;
  onUnavailable: (label: string) => void;
}) {
  return (
    <header className="results-header">
      <div className="results-header-top">
        <div className="breadcrumb">
          <button type="button" onClick={onBack}>
            用户风险画像
          </button>
          <span>/</span>
          <span>画像详情</span>
        </div>
        <TopUtilities onUnavailable={onUnavailable} />
      </div>
      <div className="results-title-row">
        <div>
          <h1>用户风险画像</h1>
          <p>跨域风险信号与关联证据的统一调查视图</p>
        </div>
        <form className="compact-search" onSubmit={onSearch}>
          <DimensionSelector
            value={dimension}
            onChange={setDimension}
            compact
          />
          <label htmlFor="compact-risk-query" className="sr-only">
            查询内容
          </label>
          <input
            id="compact-risk-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={dimensionPlaceholder[dimension]}
          />
          <button type="submit" disabled={loading} aria-label="重新查询">
            {loading ? <span className="button-spinner dark" /> : "查询"}
          </button>
        </form>
      </div>
    </header>
  );
}

function UserSummaryCard({ query }: { query: string }) {
  return (
    <section className="card user-summary-card" aria-labelledby="user-summary-title">
      <div className="user-identity">
        <div className="profile-avatar">AC</div>
        <div>
          <div className="identity-line">
            <h2 id="user-summary-title">Alex Chen</h2>
            <span className="verified-badge">已实名</span>
            <span className="account-badge">账号正常</span>
          </div>
          <p>{query || "alex.chen@example.com"}</p>
          <div className="identity-meta">
            <span>UID 184027391</span>
            <span>注册 284 天</span>
            <span>最近活跃 2 分钟前</span>
          </div>
        </div>
      </div>

      <div className="risk-score-wrap">
        <div className="risk-score">
          <span className="score-value">86</span>
          <span className="score-total">/100</span>
        </div>
        <div>
          <span className="risk-level">
            <StatusDot tone="danger" />
            高风险
          </span>
          <p>较昨日 +12</p>
        </div>
      </div>

      <div className="summary-action">
        <button type="button" className="secondary-button">
          加入重点观察
        </button>
        <button type="button" className="overflow-button" aria-label="更多操作">
          •••
        </button>
      </div>
    </section>
  );
}

function BasicInfoCard() {
  const rows = [
    ["账号类型", "个人账号"],
    ["手机号", "138****6028"],
    ["注册来源", "iOS App"],
    ["注册地区", "中国 · 上海"],
    ["认证等级", "L2 实名认证"],
    ["账户余额", "¥ 8,420.68"],
    ["最近登录", "2026-07-28 09:18"],
    ["负责策略组", "CN-Consumer"],
  ];

  return (
    <section className="card info-card" aria-labelledby="basic-info-title">
      <div className="card-heading">
        <div>
          <span className="section-index">01</span>
          <h2 id="basic-info-title">基本信息</h2>
        </div>
        <span className="data-source">多源数据已校验</span>
      </div>
      <dl className="info-grid">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function RiskTagCard() {
  const [tagMode, setTagMode] = useState<RiskMode>("登录风险");
  const tags = {
    登录风险: [
      { label: "异地设备登录", tone: "danger", confidence: "96%" },
      { label: "短时密码试错", tone: "warning", confidence: "82%" },
      { label: "代理网络访问", tone: "danger", confidence: "91%" },
      { label: "夜间敏感操作", tone: "warning", confidence: "78%" },
      { label: "可信设备", tone: "safe", confidence: "99%" },
    ],
    支付风险: [
      { label: "高频小额交易", tone: "danger", confidence: "94%" },
      { label: "新绑定银行卡", tone: "warning", confidence: "86%" },
      { label: "跨境数字商品", tone: "warning", confidence: "74%" },
      { label: "多商户聚集", tone: "danger", confidence: "89%" },
      { label: "实名信息一致", tone: "safe", confidence: "98%" },
    ],
  };

  return (
    <section className="card risk-tags-card" aria-labelledby="risk-tag-title">
      <div className="card-heading">
        <div>
          <span className="section-index">02</span>
          <h2 id="risk-tag-title">风险标签</h2>
        </div>
        <div className="segmented-control" role="tablist" aria-label="风险标签分类">
          {(["登录风险", "支付风险"] as RiskMode[]).map((mode) => (
            <button
              type="button"
              role="tab"
              aria-selected={tagMode === mode}
              className={tagMode === mode ? "active" : ""}
              onClick={() => setTagMode(mode)}
              key={mode}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      <div className="tag-summary">
        <div>
          <strong>{tagMode === "登录风险" ? 4 : 5}</strong>
          <span>命中风险标签</span>
        </div>
        <p>
          {tagMode === "登录风险"
            ? "登录侧异常信号集中于新设备与代理网络"
            : "支付侧存在短时聚集交易与新支付工具叠加"}
        </p>
      </div>
      <div className="risk-tag-list">
        {tags[tagMode].map((tag) => (
          <button className={`risk-tag ${tag.tone}`} type="button" key={tag.label}>
            <span>{tag.label}</span>
            <small>置信度 {tag.confidence}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function RiskLogsCard({
  selectedLog,
  setSelectedLog,
}: {
  selectedLog: RiskLog | null;
  setSelectedLog: (log: RiskLog | null) => void;
}) {
  const [logMode, setLogMode] = useState<RiskMode>("登录风险");
  const [period, setPeriod] = useState("7 天");
  const logs = logMode === "登录风险" ? loginLogs : paymentLogs;

  return (
    <section className="card logs-card" aria-labelledby="risk-log-title">
      <div className="card-heading logs-heading">
        <div>
          <span className="section-index">03</span>
          <h2 id="risk-log-title">风险日志</h2>
        </div>
        <div className="log-actions">
          <div className="segmented-control" role="tablist" aria-label="风险日志分类">
            {(["登录风险", "支付风险"] as RiskMode[]).map((mode) => (
              <button
                type="button"
                role="tab"
                aria-selected={logMode === mode}
                className={logMode === mode ? "active" : ""}
                onClick={() => setLogMode(mode)}
                key={mode}
              >
                {mode}
              </button>
            ))}
          </div>
          <label className="period-select-wrap">
            <span className="sr-only">时间范围</span>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              aria-label="时间范围"
            >
              <option>7 天</option>
              <option>30 天</option>
              <option>90 天</option>
            </select>
          </label>
        </div>
      </div>
      <div className="log-table-wrap">
        <table className="log-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>事件</th>
              <th>位置</th>
              <th>处置结果</th>
              <th>风险等级</th>
              <th aria-label="操作" />
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                className={selectedLog?.id === log.id ? "selected-row" : ""}
                onClick={() => setSelectedLog(log)}
              >
                <td className="mono">{log.time}</td>
                <td>
                  <button
                    className="log-event-button"
                    type="button"
                    onClick={() => setSelectedLog(log)}
                  >
                    <strong>{log.event}</strong>
                    <small>{log.detail}</small>
                  </button>
                </td>
                <td>{log.location}</td>
                <td>{log.result}</td>
                <td>
                  <RiskBadge level={log.level} />
                </td>
                <td className="row-chevron">›</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>
          显示 {logs.length} 条 · {period}内共 23 条
        </span>
        <button type="button">查看全部日志</button>
      </div>
    </section>
  );
}

function RelationGraph() {
  const [selectedNode, setSelectedNode] = useState<RelationNode>(relationNodes[1]);
  const [relationFilter, setRelationFilter] = useState("全部关联");

  const visibleNodes = useMemo(() => {
    if (relationFilter === "全部关联") return relationNodes;
    if (relationFilter === "设备") {
      return relationNodes.filter((node) => node.type === "设备");
    }
    if (relationFilter === "网络") {
      return relationNodes.filter((node) => node.type === "IP");
    }
    return relationNodes.filter((node) =>
      ["手机号", "支付工具"].includes(node.type),
    );
  }, [relationFilter]);

  return (
    <section className="card relation-card" aria-labelledby="relation-title">
      <div className="card-heading relation-heading">
        <div>
          <span className="section-index">04</span>
          <h2 id="relation-title">关联信息图</h2>
        </div>
        <div className="graph-legend" aria-label="图例">
          <span>
            <i className="legend-dot danger" /> 高风险
          </span>
          <span>
            <i className="legend-dot warning" /> 需关注
          </span>
          <span>
            <i className="legend-dot normal" /> 正常
          </span>
        </div>
      </div>
      <div className="relation-toolbar">
        <div className="relation-filters">
          {["全部关联", "设备", "网络", "身份与支付"].map((item) => (
            <button
              type="button"
              className={relationFilter === item ? "active" : ""}
              onClick={() => setRelationFilter(item)}
              key={item}
            >
              {item}
              <span>
                {item === "全部关联"
                  ? 6
                  : item === "设备" || item === "网络"
                    ? 2
                    : 2}
              </span>
            </button>
          ))}
        </div>
        <span className="graph-tip">点击节点查看证据</span>
      </div>

      <div className="graph-layout">
        <div className="graph-stage" aria-label="账号关联关系图">
          <span className="graph-grid" aria-hidden="true" />
          <span className="graph-edge edge-1" aria-hidden="true" />
          <span className="graph-edge edge-2 high" aria-hidden="true" />
          <span className="graph-edge edge-3 high" aria-hidden="true" />
          <span className="graph-edge edge-4" aria-hidden="true" />
          <span className="graph-edge edge-5" aria-hidden="true" />
          <span className="graph-edge edge-6 medium" aria-hidden="true" />
          <span className="graph-edge edge-cross high" aria-hidden="true" />

          <div className="account-node">
            <span className="account-node-ring" />
            <span className="account-node-avatar">AC</span>
            <strong>Alex Chen</strong>
            <small>UID 184027391</small>
          </div>

          {relationNodes.map((node) => {
            const visible = visibleNodes.some((item) => item.id === node.id);
            return (
              <button
                type="button"
                className={`relation-node ${node.position} ${node.risk} ${
                  selectedNode.id === node.id ? "selected" : ""
                } ${visible ? "" : "muted"}`}
                key={node.id}
                onClick={() => {
                  setSelectedNode(node);
                  if (!visible) setRelationFilter("全部关联");
                }}
                aria-pressed={selectedNode.id === node.id}
              >
                <span className="node-icon">{node.short}</span>
                <span className="node-copy">
                  <strong>{node.title}</strong>
                  <small>{node.subtitle}</small>
                </span>
              </button>
            );
          })}
        </div>

        <aside className="node-detail" aria-label="关联节点详情">
          <div className="node-detail-top">
            <span className={`node-detail-icon ${selectedNode.risk}`}>
              {selectedNode.short}
            </span>
            <div>
              <span>{selectedNode.type}</span>
              <h3>{selectedNode.title}</h3>
              <p>{selectedNode.subtitle}</p>
            </div>
          </div>
          <div className={`node-risk-callout ${selectedNode.risk}`}>
            <StatusDot
              tone={
                selectedNode.risk === "high"
                  ? "danger"
                  : selectedNode.risk === "medium"
                    ? "warning"
                    : "safe"
              }
            />
            {selectedNode.risk === "high"
              ? "该节点命中高风险情报"
              : selectedNode.risk === "medium"
                ? "该节点需要持续关注"
                : "该节点暂未发现异常"}
          </div>
          <dl className="node-stats">
            <div>
              <dt>首次关联</dt>
              <dd>{selectedNode.firstSeen}</dd>
            </div>
            <div>
              <dt>最近活跃</dt>
              <dd>{selectedNode.lastSeen}</dd>
            </div>
            <div>
              <dt>关联事件</dt>
              <dd>{selectedNode.events} 次</dd>
            </div>
            <div>
              <dt>关系强度</dt>
              <dd>{selectedNode.risk === "normal" ? "稳定" : "强关联"}</dd>
            </div>
          </dl>
          <button type="button" className="node-action">
            查看该节点完整画像
          </button>
        </aside>
      </div>
    </section>
  );
}

function LogDrawer({
  log,
  onClose,
}: {
  log: RiskLog;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="drawer-layer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <button
        className="drawer-scrim"
        type="button"
        aria-label="关闭事件详情"
        onClick={onClose}
      />
      <aside className="log-drawer">
        <div className="drawer-header">
          <div>
            <span className="drawer-kicker">风险事件详情</span>
            <h2 id="drawer-title">{log.event}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>
        <div className="drawer-risk-summary">
          <RiskBadge level={log.level} />
          <span>{log.id}</span>
        </div>
        <dl className="drawer-meta">
          <div>
            <dt>发生时间</dt>
            <dd>2026-{log.time}</dd>
          </div>
          <div>
            <dt>地理位置</dt>
            <dd>{log.location}</dd>
          </div>
          <div>
            <dt>处置结果</dt>
            <dd>{log.result}</dd>
          </div>
          <div>
            <dt>事件描述</dt>
            <dd>{log.detail}</dd>
          </div>
        </dl>
        <div className="evidence-section">
          <h3>命中证据</h3>
          <ul>
            {log.evidence.map((item, index) => (
              <li key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{item}</strong>
                  <p>该信号已通过实时策略引擎交叉验证。</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="strategy-trace">
          <span>命中策略</span>
          <strong>LOGIN-DEVICE-GEO-017</strong>
          <p>新设备 + 地理跃迁 + 高风险网络情报</p>
        </div>
        <div className="drawer-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            返回
          </button>
          <button type="button" className="primary-button">
            创建处置工单
          </button>
        </div>
      </aside>
    </div>
  );
}

function ResultsView({
  dimension,
  setDimension,
  query,
  setQuery,
  onSearch,
  loading,
  onBack,
  selectedLog,
  setSelectedLog,
  onUnavailable,
}: {
  dimension: SearchDimension;
  setDimension: (value: SearchDimension) => void;
  query: string;
  setQuery: (value: string) => void;
  onSearch: (event?: FormEvent) => void;
  loading: boolean;
  onBack: () => void;
  selectedLog: RiskLog | null;
  setSelectedLog: (log: RiskLog | null) => void;
  onUnavailable: (label: string) => void;
}) {
  return (
    <main className="results-main" id="main-content" tabIndex={-1}>
      <SummaryHeader
        dimension={dimension}
        setDimension={setDimension}
        query={query}
        setQuery={setQuery}
        onSearch={onSearch}
        loading={loading}
        onBack={onBack}
        onUnavailable={onUnavailable}
      />
      <div className="results-content">
        <UserSummaryCard query={query} />
        <div className="overview-grid">
          <BasicInfoCard />
          <RiskTagCard />
        </div>
        <RiskLogsCard selectedLog={selectedLog} setSelectedLog={setSelectedLog} />
        <RelationGraph />
      </div>
      {selectedLog ? (
        <LogDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
      ) : null}
    </main>
  );
}

export default function RiskProfilePage() {
  const [view, setView] = useState<"search" | "results">("search");
  const [dimension, setDimension] = useState<SearchDimension>("账号");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [selectedLog, setSelectedLog] = useState<RiskLog | null>(null);

  const runSearch = (event?: FormEvent) => {
    event?.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError(`请输入要查询的${dimension}`);
      return;
    }
    setError("");
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setView("results");
      setSelectedLog(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 680);
  };

  const runRecentSearch = (nextDimension: SearchDimension, value: string) => {
    setDimension(nextDimension);
    setQuery(value);
    setError("");
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setView("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 520);
  };

  const showUnavailable = (label: string) => {
    setToast(`${label}未纳入本次原型范围`);
    window.setTimeout(() => setToast(""), 2600);
  };

  const handleGlobalShortcut = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      const input = document.querySelector<HTMLInputElement>(
        view === "search" ? "#risk-query" : "#compact-risk-query",
      );
      input?.focus();
    }
  };

  return (
    <div className="app-shell" onKeyDown={handleGlobalShortcut}>
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <AppSidebar onUnavailable={showUnavailable} />
      {view === "search" ? (
        <SearchHome
          dimension={dimension}
          setDimension={setDimension}
          query={query}
          setQuery={setQuery}
          onSearch={runSearch}
          loading={loading}
          error={error}
          onRecent={runRecentSearch}
          onUnavailable={showUnavailable}
        />
      ) : (
        <ResultsView
          dimension={dimension}
          setDimension={setDimension}
          query={query}
          setQuery={setQuery}
          onSearch={runSearch}
          loading={loading}
          onBack={() => {
            setView("search");
            setSelectedLog(null);
          }}
          selectedLog={selectedLog}
          setSelectedLog={setSelectedLog}
          onUnavailable={showUnavailable}
        />
      )}
      {loading && view === "results" ? (
        <div className="refresh-overlay" aria-live="polite">
          <span className="refresh-spinner" />
          <strong>正在刷新风险画像</strong>
          <small>聚合账号、设备与风险情报…</small>
        </div>
      ) : null}
      {toast ? (
        <div className="toast" role="status" aria-live="polite">
          <span className="toast-mark">i</span>
          {toast}
        </div>
      ) : null}
    </div>
  );
}
