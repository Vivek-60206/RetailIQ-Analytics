
import { useEffect, useRef, useState } from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import {
  TrendingUp,
  ShoppingCart,
  Users,
  Database,
  ArrowUpRight,
  Activity,
  Package,
  MapPin,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import "./App.css";

const API = "http://127.0.0.1:8000";

const navigation = [
  "Overview",
  "Product Intelligence",
  "Customer Insights",
  "Regional Analysis",
  "Data Explorer",
  "About",
];

const CHART_COLORS = [
  "#CC9C54",
  "#874016",
  "#EACAA8",
  "#A7652D",
  "#69402C",
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCompactCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function buildFilterParams(filters) {
  const params = new URLSearchParams();

  if (!filters) return params;

  params.set("start_date", filters.start_date);
  params.set("end_date", filters.end_date);

  const keys = ["regions", "channels", "products", "states"];

  keys.forEach((key) => {
    (filters[key] || []).forEach((value) => {
      params.append(key, value);
    });
  });

  return params;
}

// ============================================
// REUSABLE FILTER COMPONENT
// ============================================




function MultiSelectFilter({ label, options, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const allSelected =
    selected.length === 0 || selected.length === options.length;

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function toggleOption(value) {
    if (allSelected) {
      onChange(options.filter((item) => item !== value));
    } else if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  function toggleAll() {
    onChange(allSelected ? [] : [...options]);
  }

  return (
    <div className="filter-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="filter-trigger"
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <span>{label}</span>
        <span className="filter-count">
          {allSelected ? "All selected" : `${selected.length} selected`}
        </span>
        <span className="filter-arrow">{isOpen ? "⌃" : "⌄"}</span>
      </button>

      {isOpen && (
        <div className="filter-options">
          <label className="filter-option">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
            />
            Select all
          </label>

          {options.map((option) => (
            <label className="filter-option" key={option}>
              <input
                type="checkbox"
                checked={allSelected || selected.includes(option)}
                onChange={() => toggleOption(option)}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}



// ============================================
// REUSABLE KPI CARD
// ============================================

function MetricCard({ label, value, detail, icon: Icon }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <Icon size={19} />
      </div>
      <div className="metric-value">{value}</div>
      <p>{detail}</p>
    </article>
  );
}

// ============================================
// REUSABLE TABLE
// ============================================

function DataTable({ columns, rows, emptyMessage = "No records available." }) {
  if (!rows || rows.length === 0) {
    return <p className="status-message">{emptyMessage}</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="retail-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.label}>{column.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row.Order_Number || row.Customer_Name || row.Product_Name || row.State_Name || index}>
              {columns.map((column) => (
                <td key={column.label}>
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// CHART TOOLTIP
// ============================================

const tooltipStyle = {
  background: "#24140f",
  border: "1px solid #67442f",
  borderRadius: "8px",
  color: "#f4e5d5",
};

// ============================================
// OVERVIEW PAGE
// ============================================


function OverviewPage({ dashboard, summary }) {
  const monthly = dashboard.monthly || [];
  const channels = [...(dashboard.channels || [])].sort(
    (a, b) => b.revenue - a.revenue
  );
  const regions = [...(dashboard.regions || [])].sort(
    (a, b) => b.revenue - a.revenue
  );

  const bestMonth = [...monthly].sort(
    (a, b) => b.revenue - a.revenue
  )[0];

  const latestMonth = monthly[monthly.length - 1];
  const previousMonth =
    monthly.length > 1 ? monthly[monthly.length - 2] : null;

  const revenueGrowth =
    previousMonth && previousMonth.revenue !== 0
      ? ((latestMonth.revenue - previousMonth.revenue) /
          previousMonth.revenue) *
        100
      : null;

  const topChannel = channels[0];
  const topRegion = regions[0];

  const totalChannelRevenue = channels.reduce(
    (total, item) => total + item.revenue,
    0
  );

  const topChannelShare =
    topChannel && totalChannelRevenue > 0
      ? (topChannel.revenue / totalChannelRevenue) * 100
      : 0;

  const metrics = [
    {
      label: "Total Revenue",
      value: formatCompactCurrency(summary.revenue),
      detail: "Across selected transactions",
      icon: TrendingUp,
    },
    {
      label: "Total Profit",
      value: formatCompactCurrency(summary.profit),
      detail: `${summary.profit_margin.toFixed(2)}% profit margin`,
      icon: Activity,
    },
    {
      label: "Total Orders",
      value: formatNumber(summary.orders),
      detail: "Unique orders recorded",
      icon: ShoppingCart,
    },
    {
      label: "Customers",
      value: formatNumber(summary.customers),
      detail: "Unique customers served",
      icon: Users,
    },
  ];

  return (
    <>
      {/* KEY BUSINESS METRICS */}
      <div className="metrics-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {/* SECONDARY METRICS */}
      <div className="secondary-metrics">
        <div>
          <span>PROFIT MARGIN</span>
          <strong>{summary.profit_margin.toFixed(2)}%</strong>
        </div>

        <div>
          <span>AVERAGE ORDER VALUE</span>
          <strong>
            {formatCurrency(summary.average_order_value)}
          </strong>
        </div>

        <div>
          <span>UNITS SOLD</span>
          <strong>{formatNumber(summary.units)}</strong>
        </div>

        <div>
          <span>REVENUE PER CUSTOMER</span>
          <strong>
            {formatCurrency(summary.revenue_per_customer)}
          </strong>
        </div>
      </div>

      {/* BUSINESS PERFORMANCE SNAPSHOT */}
      <section className="chart-card observations-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">BUSINESS PERFORMANCE SNAPSHOT</p>
            <h3>Key performance highlights</h3>
          </div>
          <Activity />
        </div>

        <div className="observation-grid">
          <div className="observation-item">
            <span>BEST REVENUE MONTH</span>
            <strong>
              {bestMonth?.month || "—"}
            </strong>
            <p>
              {bestMonth
                ? `${formatCurrency(bestMonth.revenue)} in recorded revenue`
                : "Monthly revenue data unavailable"}
            </p>
          </div>

          <div className="observation-item">
            <span>LEADING SALES CHANNEL</span>
            <strong>
              {topChannel?.channel || "—"}
            </strong>
            <p>
              {topChannel
                ? `${topChannelShare.toFixed(1)}% of channel revenue`
                : "Sales channel data unavailable"}
            </p>
          </div>

          <div className="observation-item">
            <span>TOP PERFORMING REGION</span>
            <strong>
              {topRegion?.us_region || "—"}
            </strong>
            <p>
              {topRegion
                ? `${formatCurrency(topRegion.revenue)} in revenue`
                : "Regional data unavailable"}
            </p>
          </div>

          <div className="observation-item">
            <span>LATEST MONTHLY REVENUE CHANGE</span>
            <strong>
              {revenueGrowth === null
                ? "N/A"
                : `${revenueGrowth > 0 ? "+" : ""}${revenueGrowth.toFixed(1)}%`}
            </strong>
            <p>
              {revenueGrowth === null
                ? "At least two months of comparable data are required"
                : "Compared with the previous available month"}
            </p>
          </div>
        </div>
      </section>

      {/* REVENUE AND PROFIT TRENDS */}
      <div className="analytics-grid">
        <article className="chart-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">REVENUE OVER TIME</p>
              <h3>Monthly revenue performance</h3>
            </div>
            <TrendingUp />
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthly}
                margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="overviewRevenueFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#CC9C54"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="100%"
                      stopColor="#CC9C54"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#3b2922"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  stroke="#a18a7b"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  stroke="#a18a7b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={formatCompactCurrency}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [
                    formatCurrency(value),
                    "Revenue",
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#CC9C54"
                  strokeWidth={3}
                  fill="url(#overviewRevenueFill)"
                  activeDot={{
                    r: 5,
                    fill: "#EACAA8",
                    stroke: "#CC9C54",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="chart-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">PROFIT OVER TIME</p>
              <h3>Monthly profit performance</h3>
            </div>
            <Activity />
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthly}
                margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient
                    id="overviewProfitFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#EACAA8"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor="#EACAA8"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#3b2922"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  stroke="#a18a7b"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  stroke="#a18a7b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={formatCompactCurrency}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [
                    formatCurrency(value),
                    "Profit",
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke="#EACAA8"
                  strokeWidth={3}
                  fill="url(#overviewProfitFill)"
                  activeDot={{
                    r: 5,
                    fill: "#CC9C54",
                    stroke: "#EACAA8",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      {/* CHANNEL AND REGIONAL ANALYSIS */}
      <div className="analytics-grid">
        <article className="chart-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">SALES CHANNELS</p>
              <h3>Revenue distribution</h3>
            </div>
            <ShoppingCart />
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channels}
                  dataKey="revenue"
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={4}
                  stroke="none"
                >
                  {channels.map((entry, index) => (
                    <Cell
                      key={entry.channel}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => formatCurrency(value)}
                />

                <Legend
                  wrapperStyle={{
                    fontSize: "11px",
                    color: "#a98c73",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="chart-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">REGIONAL PERFORMANCE</p>
              <h3>Revenue by region</h3>
            </div>
            <MapPin />
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={regions}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
              >
                <CartesianGrid
                  stroke="#3b2922"
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  stroke="#a18a7b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={formatCompactCurrency}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="us_region"
                  stroke="#a18a7b"
                  tick={{ fontSize: 10 }}
                  width={85}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => formatCurrency(value)}
                />

                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#CC9C54"
                  radius={[0, 5, 5, 0]}
                  barSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      {/* AUTOMATED BUSINESS INSIGHTS */}
      <section className="chart-card observations-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">AUTOMATED BUSINESS INSIGHTS</p>
            <h3>What the data tells us</h3>
          </div>
          <Activity />
        </div>

        <div className="observation-grid">
          {(dashboard.observations || []).map((item) => (
            <div className="observation-item" key={item.title}>
              <span>{item.title}</span>
              <strong>{item.value}</strong>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}


// ============================================
// PRODUCT INTELLIGENCE PAGE
// ============================================


function ProductPage({ dashboard }) {
  const [sortConfig, setSortConfig] = useState({
    key: "revenue",
    direction: "desc",
  });

  const products = dashboard.products || [];

  const getMargin = (product) =>
    product.revenue > 0
      ? (product.profit / product.revenue) * 100
      : 0;

  const sortedByRevenue = [...products].sort(
    (a, b) => b.revenue - a.revenue
  );

  const topProducts = sortedByRevenue.slice(0, 10);

  const bottomProducts = [...products]
    .sort((a, b) => a.revenue - b.revenue)
    .slice(0, 10);

  const highestProfitProduct = [...products].sort(
    (a, b) => b.profit - a.profit
  )[0];

  const highestMarginProduct = [...products].sort(
    (a, b) => getMargin(b) - getMargin(a)
  )[0];

  const lowestRevenueProduct = bottomProducts[0];

  const totalRevenue = products.reduce(
    (sum, product) => sum + product.revenue,
    0
  );

  const totalProfit = products.reduce(
    (sum, product) => sum + product.profit,
    0
  );

  const totalUnits = products.reduce(
    (sum, product) => sum + product.units,
    0
  );

  const overallMargin =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const sortedCatalogue = [...products].sort((a, b) => {
    const aValue =
      sortConfig.key === "margin"
        ? getMargin(a)
        : a[sortConfig.key];

    const bValue =
      sortConfig.key === "margin"
        ? getMargin(b)
        : b[sortConfig.key];

    if (typeof aValue === "string") {
      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortConfig.direction === "asc"
      ? aValue - bValue
      : bValue - aValue;
  });

  function handleSort(key) {
    setSortConfig((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === "desc"
          ? "asc"
          : "desc",
    }));
  }

  function sortIndicator(key) {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  }

  const productColumns = [
    { label: "Product", key: "Product_Name" },
    { label: "Revenue", key: "revenue" },
    { label: "Profit", key: "profit" },
    { label: "Units Sold", key: "units" },
    { label: "Profit Margin", key: "margin" },
  ];

  return (
    <>
      <div className="page-intro">
        <p>PRODUCT PERFORMANCE</p>
        <h3>Know what sells. Know what earns.</h3>
        <span>
          Explore product revenue, profitability and sales volume
          to identify your strongest and weakest performers.
        </span>
      </div>

      {/* PRODUCT PERFORMANCE HIGHLIGHTS */}
      <section className="product-summary-grid">
        <article className="product-summary-card">
          <span>TOTAL PRODUCT REVENUE</span>
          <strong>{formatCurrency(totalRevenue)}</strong>
          <small>Revenue across selected products</small>
        </article>

        <article className="product-summary-card">
          <span>TOTAL PRODUCT PROFIT</span>
          <strong>{formatCurrency(totalProfit)}</strong>
          <small>Profit generated by all products</small>
        </article>

        <article className="product-summary-card">
          <span>OVERALL PROFIT MARGIN</span>
          <strong>{overallMargin.toFixed(2)}%</strong>
          <small>Profit as a share of revenue</small>
        </article>

        <article className="product-summary-card">
          <span>TOTAL UNITS SOLD</span>
          <strong>{formatNumber(totalUnits)}</strong>
          <small>Units across selected products</small>
        </article>
      </section>

      {/* PRODUCT INSIGHTS */}
      <section className="chart-card product-insights-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">PRODUCT INTELLIGENCE</p>
            <h3>Product performance highlights</h3>
          </div>
          <Package />
        </div>

        <div className="product-insights-grid">
          <div className="product-insight">
            <span>HIGHEST REVENUE</span>
            <strong>
              {sortedByRevenue[0]?.Product_Name || "—"}
            </strong>
            <p>
              {sortedByRevenue[0]
                ? formatCurrency(sortedByRevenue[0].revenue)
                : "No data available"}
            </p>
          </div>

          <div className="product-insight">
            <span>HIGHEST PROFIT</span>
            <strong>
              {highestProfitProduct?.Product_Name || "—"}
            </strong>
            <p>
              {highestProfitProduct
                ? formatCurrency(highestProfitProduct.profit)
                : "No data available"}
            </p>
          </div>

          <div className="product-insight">
            <span>BEST PROFIT MARGIN</span>
            <strong>
              {highestMarginProduct?.Product_Name || "—"}
            </strong>
            <p>
              {highestMarginProduct
                ? `${getMargin(highestMarginProduct).toFixed(2)}% margin`
                : "No data available"}
            </p>
          </div>

          <div className="product-insight">
            <span>LOWEST REVENUE</span>
            <strong>
              {lowestRevenueProduct?.Product_Name || "—"}
            </strong>
            <p>
              {lowestRevenueProduct
                ? formatCurrency(lowestRevenueProduct.revenue)
                : "No data available"}
            </p>
          </div>
        </div>
      </section>

      {/* TOP AND BOTTOM PRODUCT RANKINGS */}
      <div className="analytics-grid product-ranking-grid">
        <article className="chart-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">TOP PERFORMERS</p>
              <h3>Top 10 products by revenue</h3>
            </div>
            <TrendingUp />
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ left: 5, right: 15 }}
              >
                <CartesianGrid
                  stroke="#3b2922"
                  strokeDasharray="3 3"
                />

                <XAxis
                  type="number"
                  stroke="#a18a7b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={formatCompactCurrency}
                />

                <YAxis
                  type="category"
                  dataKey="Product_Name"
                  stroke="#a18a7b"
                  tick={{ fontSize: 10 }}
                  width={85}
                />

                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    formatCurrency(value),
                    name,
                  ]}
                />

                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#CC9C54"
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="chart-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">LOWEST PERFORMERS</p>
              <h3>Bottom 10 products by revenue</h3>
            </div>
            <Package />
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bottomProducts}
                layout="vertical"
                margin={{ left: 5, right: 15 }}
              >
                <CartesianGrid
                  stroke="#3b2922"
                  strokeDasharray="3 3"
                />

                <XAxis
                  type="number"
                  stroke="#a18a7b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={formatCompactCurrency}
                />

                <YAxis
                  type="category"
                  dataKey="Product_Name"
                  stroke="#a18a7b"
                  tick={{ fontSize: 10 }}
                  width={85}
                />

                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    formatCurrency(value),
                    name,
                  ]}
                />

                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#874016"
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      {/* PROFITABILITY COMPARISON */}
      <section className="chart-card product-profit-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">PROFITABILITY ANALYSIS</p>
            <h3>Revenue versus profit by product</h3>
          </div>
          <Activity />
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topProducts}
              margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                stroke="#3b2922"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="Product_Name"
                stroke="#a18a7b"
                tick={{ fontSize: 10 }}
              />

              <YAxis
                stroke="#a18a7b"
                tick={{ fontSize: 10 }}
                tickFormatter={formatCompactCurrency}
              />

              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => formatCurrency(value)}
              />

              <Legend
                wrapperStyle={{
                  fontSize: "11px",
                  color: "#a98c73",
                }}
              />

              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#CC9C54"
                radius={[4, 4, 0, 0]}
              />

              <Bar
                dataKey="profit"
                name="Profit"
                fill="#874016"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* SORTABLE PRODUCT CATALOGUE */}
      <section className="chart-card table-card product-catalogue-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">PRODUCT CATALOGUE</p>
            <h3>Complete product performance</h3>
            <p className="product-table-subtitle">
              {products.length} products in the current selection.
              Select a column heading to sort the table.
            </p>
          </div>
          <Database />
        </div>

        <div className="table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                {productColumns.map((column) => (
                  <th key={column.key}>
                    <button
                      type="button"
                      className="product-sort-button"
                      onClick={() => handleSort(column.key)}
                    >
                      {column.label}
                      <span>{sortIndicator(column.key)}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedCatalogue.map((product, index) => (
                <tr key={product.Product_Name}>
                  <td>
                    <span className="product-rank">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <strong>{product.Product_Name}</strong>
                  </td>

                  <td>{formatCurrency(product.revenue)}</td>

                  <td>{formatCurrency(product.profit)}</td>

                  <td>{formatNumber(product.units)}</td>

                  <td>
                    <span className="product-margin">
                      {getMargin(product).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="product-empty">
                    No product records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}


// ============================================
// CUSTOMER INSIGHTS PAGE
// ============================================


function CustomerPage({ dashboard }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "revenue",
    direction: "desc",
  });

  const customers = dashboard.customers || [];

  const sortedByRevenue = [...customers].sort(
    (a, b) => b.revenue - a.revenue
  );

  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.revenue,
    0
  );

  const totalProfit = customers.reduce(
    (sum, customer) => sum + customer.profit,
    0
  );

  const totalOrders = customers.reduce(
    (sum, customer) => sum + customer.orders,
    0
  );

  const averageRevenue = customers.length
    ? totalRevenue / customers.length
    : 0;

  const averageOrders = customers.length
    ? totalOrders / customers.length
    : 0;

  const getMargin = (customer) =>
    customer.revenue > 0
      ? (customer.profit / customer.revenue) * 100
      : 0;

  // Relative customer value segments
  const highCount = Math.ceil(customers.length * 0.2);
  const lowCount = Math.ceil(customers.length * 0.2);

  const highValueCustomers = sortedByRevenue.slice(0, highCount);

  const lowValueCustomers = sortedByRevenue.slice(
    Math.max(0, customers.length - lowCount)
  );

  const mediumValueCustomers = sortedByRevenue.slice(
    highCount,
    Math.max(highCount, customers.length - lowCount)
  );

  const segmentData = [
    {
      name: "High Value",
      value: highValueCustomers.length,
      fill: "#CC9C54",
    },
    {
      name: "Medium Value",
      value: mediumValueCustomers.length,
      fill: "#874016",
    },
    {
      name: "Low Value",
      value: lowValueCustomers.length,
      fill: "#69402C",
    },
  ].filter((segment) => segment.value > 0);

  // Customer highlights
  const highestRevenueCustomer = sortedByRevenue[0];

  const highestProfitCustomer = [...customers].sort(
    (a, b) => b.profit - a.profit
  )[0];

  const mostOrdersCustomer = [...customers].sort(
    (a, b) => b.orders - a.orders
  )[0];

  const highestAOVCustomer = [...customers].sort(
    (a, b) => b.average_order_value - a.average_order_value
  )[0];

  // Search and sorting
  const filteredCustomers = customers.filter((customer) =>
    customer.Customer_Name.toLowerCase().includes(
      searchTerm.toLowerCase()
    )
  );

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const aValue =
      sortConfig.key === "margin"
        ? getMargin(a)
        : a[sortConfig.key];

    const bValue =
      sortConfig.key === "margin"
        ? getMargin(b)
        : b[sortConfig.key];

    const comparison =
      typeof aValue === "string"
        ? aValue.localeCompare(bValue)
        : aValue - bValue;

    return sortConfig.direction === "asc"
      ? comparison
      : -comparison;
  });

  function handleSort(key) {
    setSortConfig((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === "desc"
          ? "asc"
          : "desc",
    }));
  }

  function sortIndicator(key) {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  }

  const summaryCards = [
    {
      label: "TOTAL CUSTOMERS",
      value: formatNumber(customers.length),
      detail: "Customers in current selection",
      icon: Users,
    },
    {
      label: "CUSTOMER REVENUE",
      value: formatCompactCurrency(totalRevenue),
      detail: "Revenue across selected customers",
      icon: TrendingUp,
    },
    {
      label: "AVG. REVENUE / CUSTOMER",
      value: formatCompactCurrency(averageRevenue),
      detail: "Average customer contribution",
      icon: Activity,
    },
    {
      label: "AVG. ORDERS / CUSTOMER",
      value: formatNumber(averageOrders),
      detail: "Average orders per customer",
      icon: ShoppingCart,
    },
  ];

  const customerHighlights = [
    {
      label: "HIGHEST REVENUE",
      customer: highestRevenueCustomer,
      value: highestRevenueCustomer
        ? formatCurrency(highestRevenueCustomer.revenue)
        : "—",
    },
    {
      label: "HIGHEST PROFIT",
      customer: highestProfitCustomer,
      value: highestProfitCustomer
        ? formatCurrency(highestProfitCustomer.profit)
        : "—",
    },
    {
      label: "MOST ORDERS",
      customer: mostOrdersCustomer,
      value: mostOrdersCustomer
        ? `${formatNumber(mostOrdersCustomer.orders)} orders`
        : "—",
    },
    {
      label: "HIGHEST AVERAGE ORDER VALUE",
      customer: highestAOVCustomer,
      value: highestAOVCustomer
        ? formatCurrency(highestAOVCustomer.average_order_value)
        : "—",
    },
  ];

  const topCustomers = sortedByRevenue.slice(0, 10);

  return (
    <>
      <div className="page-intro">
        <p>CUSTOMER PERFORMANCE</p>
        <h3>Understand the value behind every customer.</h3>
        <span>
          Analyse customer contribution, purchasing behaviour and
          profitability across your selected data.
        </span>
      </div>

      {/* CUSTOMER KPI CARDS */}
      <div className="customer-summary-grid">
        {summaryCards.map((metric) => {
          const Icon = metric.icon;

          return (
            <article className="customer-summary-card" key={metric.label}>
              <div className="customer-summary-top">
                <span>{metric.label}</span>
                <Icon size={19} />
              </div>

              <strong>{metric.value}</strong>
              <p>{metric.detail}</p>
            </article>
          );
        })}
      </div>

      {/* CUSTOMER HIGHLIGHTS */}
      <section className="customer-highlights-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CUSTOMER INTELLIGENCE</p>
            <h3>Customer performance highlights</h3>
          </div>
        </div>

        <div className="customer-highlights-grid">
          {customerHighlights.map((item) => (
            <article className="customer-highlight-card" key={item.label}>
              <p>{item.label}</p>

              <h4>
                {item.customer?.Customer_Name || "No data"}
              </h4>

              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      {/* CUSTOMER SEGMENTATION */}
      <div className="customer-segmentation-grid">
        <article className="chart-card customer-segment-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">CUSTOMER SEGMENTATION</p>
              <h3>Customer value distribution</h3>
            </div>
            <Users />
          </div>

          <div className="chart-container">
            {customers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {segmentData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.fill}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [
                      `${formatNumber(value)} customers`,
                      "Count",
                    ]}
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="status-message">No customer data available.</p>
            )}
          </div>

          <p className="customer-segment-note">
            Segments are ranked by revenue: top 20%, middle 60% and
            bottom 20% of selected customers.
          </p>
        </article>

        <article className="chart-card customer-segment-details">
          <div className="card-heading">
            <div>
              <p className="eyebrow">CUSTOMER VALUE TIERS</p>
              <h3>Segment breakdown</h3>
            </div>
            <Activity />
          </div>

          <div className="customer-tier-list">
            <div className="customer-tier">
              <span className="tier-dot high-tier"></span>
              <div>
                <strong>High Value</strong>
                <p>Top 20% by customer revenue</p>
              </div>
              <b>{formatNumber(highValueCustomers.length)}</b>
            </div>

            <div className="customer-tier">
              <span className="tier-dot medium-tier"></span>
              <div>
                <strong>Medium Value</strong>
                <p>Middle 60% by customer revenue</p>
              </div>
              <b>{formatNumber(mediumValueCustomers.length)}</b>
            </div>

            <div className="customer-tier">
              <span className="tier-dot low-tier"></span>
              <div>
                <strong>Low Value</strong>
                <p>Bottom 20% by customer revenue</p>
              </div>
              <b>{formatNumber(lowValueCustomers.length)}</b>
            </div>
          </div>
        </article>
      </div>

      {/* CUSTOMER REVENUE AND PROFIT */}
      <div className="customer-profit-card chart-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">CUSTOMER PROFITABILITY</p>
            <h3>Revenue versus profit by customer</h3>
          </div>
          <TrendingUp />
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCustomers}>
              <CartesianGrid
                stroke="#3b2922"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="Customer_Name"
                stroke="#a18a7b"
                tick={{ fontSize: 9 }}
                interval={0}
                angle={-18}
                textAnchor="end"
                height={65}
              />

              <YAxis
                stroke="#a18a7b"
                tickFormatter={formatCompactCurrency}
              />

              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => formatCurrency(value)}
              />

              <Legend />

              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#CC9C54"
                radius={[4, 4, 0, 0]}
              />

              <Bar
                dataKey="profit"
                name="Profit"
                fill="#874016"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ORDERS VS REVENUE */}
      <article className="chart-card customer-scatter-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">PURCHASING BEHAVIOUR</p>
            <h3>Orders versus customer revenue</h3>
          </div>
          <Activity />
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid
                stroke="#3b2922"
                strokeDasharray="3 3"
              />

              <XAxis
                type="number"
                dataKey="orders"
                name="Orders"
                stroke="#a18a7b"
                tick={{ fontSize: 10 }}
              />

              <YAxis
                type="number"
                dataKey="revenue"
                name="Revenue"
                stroke="#a18a7b"
                tickFormatter={formatCompactCurrency}
                tick={{ fontSize: 10 }}
              />

              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) =>
                  name === "Revenue"
                    ? formatCurrency(value)
                    : formatNumber(value)
                }
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.Customer_Name || "Customer"
                }
              />

              <Scatter
                data={customers}
                fill="#CC9C54"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </article>

      {/* CUSTOMER DATABASE */}
      <section className="chart-card customer-database-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">CUSTOMER DATABASE</p>
            <h3>Customer performance details</h3>
            <p className="customer-table-subtitle">
              {formatNumber(filteredCustomers.length)} customers found.
              Search by name or select a column to sort.
            </p>
          </div>
          <Users />
        </div>

        <div className="customer-table-toolbar">
          <div className="customer-search-box">
            <Search size={16} />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search customers..."
              aria-label="Search customers"
            />
          </div>

          <span>
            {formatNumber(customers.length)} total customers
          </span>
        </div>

        <div className="table-wrapper">
          <table className="retail-table customer-table">
            <thead>
              <tr>
                {[
                  { label: "Customer", key: "Customer_Name" },
                  { label: "Revenue", key: "revenue" },
                  { label: "Profit", key: "profit" },
                  { label: "Orders", key: "orders" },
                  {
                    label: "Average Order Value",
                    key: "average_order_value",
                  },
                  { label: "Profit Margin", key: "margin" },
                ].map((column) => (
                  <th key={column.key}>
                    <button
                      type="button"
                      className="customer-sort-button"
                      onClick={() => handleSort(column.key)}
                    >
                      {column.label}
                      <span>{sortIndicator(column.key)}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedCustomers.length > 0 ? (
                sortedCustomers.map((customer, index) => (
                  <tr key={customer.Customer_Name}>
                    <td>
                      <span className="customer-table-rank">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {customer.Customer_Name}
                    </td>

                    <td>{formatCurrency(customer.revenue)}</td>
                    <td>{formatCurrency(customer.profit)}</td>
                    <td>{formatNumber(customer.orders)}</td>
                    <td>
                      {formatCurrency(customer.average_order_value)}
                    </td>
                    <td className="customer-table-margin">
                      {getMargin(customer).toFixed(2)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="customer-empty-row">
                    No customers match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ============================================
// REGIONAL ANALYSIS PAGE
// ============================================


function RegionalPage({ dashboard }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "revenue",
    direction: "desc",
  });

  const regions = dashboard.regions || [];
  const states = dashboard.states || [];
  const mapPoints = dashboard.map || [];

  const totalRevenue = regions.reduce(
    (sum, region) => sum + region.revenue,
    0
  );

  const totalProfit = regions.reduce(
    (sum, region) => sum + region.profit,
    0
  );

  const totalOrders = regions.reduce(
    (sum, region) => sum + region.orders,
    0
  );

  const overallMargin = totalRevenue
    ? (totalProfit / totalRevenue) * 100
    : 0;

  const getMargin = (item) =>
    item.revenue > 0
      ? (item.profit / item.revenue) * 100
      : 0;

  const topStates = [...states]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const bottomStates = [...states]
    .sort((a, b) => a.revenue - b.revenue)
    .slice(0, 10);

  const highestRevenueState = [...states].sort(
    (a, b) => b.revenue - a.revenue
  )[0];

  const highestProfitState = [...states].sort(
    (a, b) => b.profit - a.profit
  )[0];

  const bestMarginState = [...states].sort(
    (a, b) => getMargin(b) - getMargin(a)
  )[0];

  const leadingRegion = [...regions].sort(
    (a, b) => b.revenue - a.revenue
  )[0];

  const summaryCards = [
    {
      label: "TOTAL REGIONAL REVENUE",
      value: formatCompactCurrency(totalRevenue),
      detail: "Revenue across selected regions",
      icon: TrendingUp,
    },
    {
      label: "TOTAL REGIONAL PROFIT",
      value: formatCompactCurrency(totalProfit),
      detail: "Recorded profit across regions",
      icon: Activity,
    },
    {
      label: "OVERALL PROFIT MARGIN",
      value: `${overallMargin.toFixed(2)}%`,
      detail: "Profit as a share of revenue",
      icon: ArrowUpRight,
    },
    {
      label: "TOTAL ORDERS",
      value: formatNumber(totalOrders),
      detail: `${formatNumber(states.length)} states represented`,
      icon: ShoppingCart,
    },
  ];

  const highlights = [
    {
      label: "TOP REVENUE STATE",
      name: highestRevenueState?.State_Name,
      value: highestRevenueState
        ? formatCurrency(highestRevenueState.revenue)
        : "—",
    },
    {
      label: "TOP PROFIT STATE",
      name: highestProfitState?.State_Name,
      value: highestProfitState
        ? formatCurrency(highestProfitState.profit)
        : "—",
    },
    {
      label: "BEST PROFIT MARGIN",
      name: bestMarginState?.State_Name,
      value: bestMarginState
        ? `${getMargin(bestMarginState).toFixed(2)}%`
        : "—",
    },
    {
      label: "LEADING REGION",
      name: leadingRegion?.us_region,
      value: leadingRegion
        ? formatCurrency(leadingRegion.revenue)
        : "—",
    },
  ];

  const filteredStates = states.filter((state) =>
    state.State_Name.toLowerCase().includes(
      searchTerm.toLowerCase()
    )
  );

  const sortedStates = [...filteredStates].sort((a, b) => {
    const aValue =
      sortConfig.key === "margin"
        ? getMargin(a)
        : a[sortConfig.key];

    const bValue =
      sortConfig.key === "margin"
        ? getMargin(b)
        : b[sortConfig.key];

    const comparison =
      typeof aValue === "string"
        ? aValue.localeCompare(bValue)
        : aValue - bValue;

    return sortConfig.direction === "asc"
      ? comparison
      : -comparison;
  });

  function handleSort(key) {
    setSortConfig((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === "desc"
          ? "asc"
          : "desc",
    }));
  }

  function sortIndicator(key) {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  }

  return (
    <>
      <div className="page-intro">
        <p>GEOGRAPHICAL PERFORMANCE</p>
        <h3>Discover where your business grows.</h3>
        <span>
          Compare regional contribution, state performance and
          geographical profitability.
        </span>
      </div>

      {/* REGIONAL KPI CARDS */}
      <div className="regional-summary-grid">
        {summaryCards.map((metric) => {
          const Icon = metric.icon;

          return (
            <article className="regional-summary-card" key={metric.label}>
              <div className="regional-summary-top">
                <span>{metric.label}</span>
                <Icon size={19} />
              </div>

              <strong>{metric.value}</strong>
              <p>{metric.detail}</p>
            </article>
          );
        })}
      </div>

      {/* REGIONAL HIGHLIGHTS */}
      <section className="regional-highlights-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">REGIONAL INTELLIGENCE</p>
            <h3>Geographical performance highlights</h3>
          </div>
        </div>

        <div className="regional-highlights-grid">
          {highlights.map((item) => (
            <article className="regional-highlight-card" key={item.label}>
              <p>{item.label}</p>
              <h4>{item.name || "No data"}</h4>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      {/* REGION COMPARISON */}
      <article className="chart-card regional-chart-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">REGIONAL COMPARISON</p>
            <h3>Revenue and profit by region</h3>
          </div>
          <MapPin />
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regions}>
              <CartesianGrid
                stroke="#3b2922"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="us_region"
                stroke="#a18a7b"
                tick={{ fontSize: 10 }}
              />

              <YAxis
                stroke="#a18a7b"
                tickFormatter={formatCompactCurrency}
              />

              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => formatCurrency(value)}
              />

              <Legend />

              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#CC9C54"
                radius={[5, 5, 0, 0]}
              />

              <Bar
                dataKey="profit"
                name="Profit"
                fill="#874016"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      {/* TOP AND BOTTOM STATES */}
      <div className="analytics-grid regional-ranking-grid">
        <article className="chart-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">TOP PERFORMERS</p>
              <h3>Top 10 states by revenue</h3>
            </div>
            <TrendingUp />
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStates} layout="vertical">
                <CartesianGrid
                  stroke="#3b2922"
                  strokeDasharray="3 3"
                />

                <XAxis
                  type="number"
                  stroke="#a18a7b"
                  tickFormatter={formatCompactCurrency}
                />

                <YAxis
                  type="category"
                  dataKey="State_Name"
                  stroke="#a18a7b"
                  tick={{ fontSize: 9 }}
                  width={105}
                />

                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => formatCurrency(value)}
                />

                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#CC9C54"
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="chart-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">LOWER PERFORMERS</p>
              <h3>Bottom 10 states by revenue</h3>
            </div>
            <MapPin />
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bottomStates} layout="vertical">
                <CartesianGrid
                  stroke="#3b2922"
                  strokeDasharray="3 3"
                />

                <XAxis
                  type="number"
                  stroke="#a18a7b"
                  tickFormatter={formatCompactCurrency}
                />

                <YAxis
                  type="category"
                  dataKey="State_Name"
                  stroke="#a18a7b"
                  tick={{ fontSize: 9 }}
                  width={105}
                />

                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => formatCurrency(value)}
                />

                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#874016"
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      {/* STATE PROFITABILITY */}
      <article className="chart-card regional-chart-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">STATE PROFITABILITY</p>
            <h3>Revenue versus profit by state</h3>
          </div>
          <Activity />
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid
                stroke="#3b2922"
                strokeDasharray="3 3"
              />

              <XAxis
                type="number"
                dataKey="revenue"
                name="Revenue"
                stroke="#a18a7b"
                tickFormatter={formatCompactCurrency}
              />

              <YAxis
                type="number"
                dataKey="profit"
                name="Profit"
                stroke="#a18a7b"
                tickFormatter={formatCompactCurrency}
              />

              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) =>
                  formatCurrency(value)
                }
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.State_Name || "State"
                }
              />

              <Scatter
                data={states}
                name="States"
                fill="#CC9C54"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </article>

      {/* STATE DATABASE */}
      <section className="chart-card regional-database-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">STATE PERFORMANCE DATABASE</p>
            <h3>Detailed geographical sales data</h3>
            <p className="regional-table-subtitle">
              {formatNumber(filteredStates.length)} states found.
              Search or sort the table to compare performance.
            </p>
          </div>
          <Database />
        </div>

        <div className="regional-table-toolbar">
          <div className="regional-search-box">
            <Search size={16} />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search states..."
              aria-label="Search states"
            />
          </div>

          <span>{formatNumber(states.length)} total states</span>
        </div>

        <div className="table-wrapper">
          <table className="retail-table regional-table">
            <thead>
              <tr>
                {[
                  { label: "State", key: "State_Name" },
                  { label: "Revenue", key: "revenue" },
                  { label: "Profit", key: "profit" },
                  { label: "Orders", key: "orders" },
                  { label: "Profit Margin", key: "margin" },
                ].map((column) => (
                  <th key={column.key}>
                    <button
                      type="button"
                      className="regional-sort-button"
                      onClick={() => handleSort(column.key)}
                    >
                      {column.label}
                      <span>{sortIndicator(column.key)}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedStates.length > 0 ? (
                sortedStates.map((state, index) => (
                  <tr key={state.State_Name}>
                    <td>
                      <span className="regional-table-rank">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {state.State_Name}
                    </td>

                    <td>{formatCurrency(state.revenue)}</td>
                    <td>{formatCurrency(state.profit)}</td>
                    <td>{formatNumber(state.orders)}</td>
                    <td className="regional-table-margin">
                      {getMargin(state).toFixed(2)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="regional-empty-row">
                    No states match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* COORDINATE PLOT */}
      <section className="chart-card regional-map-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">GEOGRAPHIC COORDINATES</p>
            <h3>State locations by latitude and longitude</h3>
          </div>
          <MapPin />
        </div>

        <p className="regional-map-note">
          This plot uses the latitude and longitude values supplied
          by the dataset. It is a coordinate scatter plot, not an
          interactive geographic map.
        </p>

        {mapPoints.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid
                  stroke="#3b2922"
                  strokeDasharray="3 3"
                />

                <XAxis
                  type="number"
                  dataKey="lon"
                  name="Longitude"
                  stroke="#a18a7b"
                  tick={{ fontSize: 10 }}
                />

                <YAxis
                  type="number"
                  dataKey="lat"
                  name="Latitude"
                  stroke="#a18a7b"
                  tick={{ fontSize: 10 }}
                />

                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) =>
                    name === "Revenue"
                      ? formatCurrency(value)
                      : value
                  }
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.State_Name || "Location"
                  }
                />

                <Scatter
                  data={mapPoints}
                  name="State locations"
                  fill="#CC9C54"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="status-message">
            No geographic coordinates available.
          </p>
        )}
      </section>
    </>
  );
}

// ============================================
// DATA EXPLORER PAGE
// ============================================


function DataExplorerPage({ filters }) {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loadingRows, setLoadingRows] = useState(false);
  const [transactionError, setTransactionError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortConfig, setSortConfig] = useState({
    key: "order_date",
    direction: "desc",
  });

  const [pageInfo, setPageInfo] = useState({
    total_records: 0,
    total_pages: 0,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  // Reset pagination when filters or search change
  useEffect(() => {
    setPage(1);
  }, [filters, debouncedSearch, pageSize]);

  // Fetch transactions
  useEffect(() => {
    let cancelled = false;

    async function fetchTransactions() {
      setLoadingRows(true);
      setTransactionError("");

      try {
        const params = buildFilterParams(filters);
        params.set("page", String(page));
        params.set("page_size", String(pageSize));

        if (debouncedSearch) {
          params.set("search", debouncedSearch);
        }

        const response = await fetch(
          `${API}/api/transactions?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Unable to load transaction records.");
        }

        const result = await response.json();

        if (!cancelled) {
          setTransactions(result.records || []);
          setPageInfo(result);
        }
      } catch (err) {
        if (!cancelled) {
          setTransactionError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingRows(false);
        }
      }
    }

    fetchTransactions();

    return () => {
      cancelled = true;
    };
  }, [filters, page, pageSize, debouncedSearch]);

  // Export all records matching global filters
  function downloadCSV() {
    const params = buildFilterParams(filters);

    window.open(
      `${API}/api/export?${params.toString()}`,
      "_blank"
    );
  }

  // Sorting applies to the currently loaded page
  function handleSort(key) {
    setSortConfig((previous) => ({
      key,
      direction:
        previous.key === key && previous.direction === "asc"
          ? "desc"
          : "asc",
    }));
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    const first = a[sortConfig.key];
    const second = b[sortConfig.key];

    if (first == null) return 1;
    if (second == null) return -1;

    const firstNumber = Number(first);
    const secondNumber = Number(second);

    let comparison;

    if (
      first !== "" &&
      second !== "" &&
      Number.isFinite(firstNumber) &&
      Number.isFinite(secondNumber)
    ) {
      comparison = firstNumber - secondNumber;
    } else {
      comparison = String(first).localeCompare(
        String(second),
        undefined,
        { numeric: true, sensitivity: "base" }
      );
    }

    return sortConfig.direction === "asc"
      ? comparison
      : -comparison;
  });

  const totalQuantity = transactions.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0),
    0
  );

  const pageRevenue = transactions.reduce(
    (sum, row) => sum + (Number(row.revenue) || 0),
    0
  );

  const pageProfit = transactions.reduce(
    (sum, row) => sum + (Number(row.profit) || 0),
    0
  );

  const columns = [
    { label: "Order Number", key: "Order_Number" },
    { label: "Order Date", key: "order_date" },
    { label: "Customer", key: "Customer_Name" },
    { label: "Product", key: "Product_Name" },
    { label: "Channel", key: "channel" },
    { label: "State", key: "State_Name" },
    { label: "Region", key: "us_region" },
    {
      label: "Quantity",
      key: "quantity",
      render: (value) => formatNumber(value),
    },
    {
      label: "Revenue",
      key: "revenue",
      render: (value) => formatCurrency(value),
    },
    {
      label: "Profit",
      key: "profit",
      render: (value) => formatCurrency(value),
    },
  ];

  const totalPages = pageInfo.total_pages || 1;
  const totalRecords = pageInfo.total_records || 0;
  const firstRecord =
    totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRecord = Math.min(page * pageSize, totalRecords);

  return (
    <>
      <div className="page-intro">
        <p>TRANSACTION DATABASE</p>
        <h3>Explore your retail records.</h3>
        <span>
          Search, inspect, analyse and export your retail transactions.
        </span>
      </div>

      {/* TRANSACTION SUMMARY */}
      <section className="explorer-summary-grid">
        <article className="explorer-stat-card">
          <span>FILTERED TRANSACTIONS</span>
          <strong>{formatNumber(totalRecords)}</strong>
          <small>Records matching your filters and search</small>
        </article>

        <article className="explorer-stat-card">
          <span>PAGE REVENUE</span>
          <strong>{formatCompactCurrency(pageRevenue)}</strong>
          <small>Revenue on the current page</small>
        </article>

        <article className="explorer-stat-card">
          <span>PAGE PROFIT</span>
          <strong>{formatCompactCurrency(pageProfit)}</strong>
          <small>Profit on the current page</small>
        </article>

        <article className="explorer-stat-card">
          <span>PAGE QUANTITY</span>
          <strong>{formatNumber(totalQuantity)}</strong>
          <small>Units on the current page</small>
        </article>
      </section>

      {/* TRANSACTION TABLE */}
      <section className="chart-card explorer-card explorer-main-card">
        <div className="explorer-heading">
          <div>
            <p className="eyebrow">RETAIL RECORDS</p>
            <h3>Transaction database</h3>
            <span>
              Search and inspect individual sales transactions.
            </span>
          </div>

          <Database size={22} />
        </div>

        <div className="explorer-toolbar explorer-toolbar-new">
          <div className="explorer-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search order, customer, product, state..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                className="explorer-clear-search"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="explorer-actions">
            <div className="explorer-page-size">
              <label htmlFor="explorer-page-size">Rows</label>

              <select
                id="explorer-page-size"
                value={pageSize}
                onChange={(event) =>
                  setPageSize(Number(event.target.value))
                }
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <button
              className="export-button"
              onClick={downloadCSV}
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="explorer-table-meta">
          <span>
            Showing <strong>{formatNumber(firstRecord)}</strong>–
            <strong>{formatNumber(lastRecord)}</strong> of{" "}
            <strong>{formatNumber(totalRecords)}</strong> records
          </span>

          <span>
            Page {page} of {totalPages}
          </span>
        </div>

        {loadingRows && (
          <p className="status-message">
            Loading transaction records...
          </p>
        )}

        {transactionError && (
          <p className="status-message error-message">
            {transactionError}
          </p>
        )}

        {!loadingRows && !transactionError && (
          <div className="explorer-table-wrapper">
            {transactions.length > 0 ? (
              <table className="explorer-table">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key}>
                        <button
                          className="explorer-sort-button"
                          onClick={() => handleSort(column.key)}
                        >
                          {column.label}

                          <span>
                            {sortConfig.key === column.key
                              ? sortConfig.direction === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {sortedTransactions.map((row, index) => (
                    <tr
                      key={`${row.Order_Number || "record"}-${index}`}
                    >
                      {columns.map((column) => (
                        <td key={column.key}>
                          {column.render
                            ? column.render(row[column.key])
                            : row[column.key] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="explorer-empty">
                <Database size={30} />
                <h3>No transactions found</h3>
                <p>
                  Try changing your search or adjusting the global filters.
                </p>
              </div>
            )}
          </div>
        )}

        {/* PAGINATION */}
        <div className="explorer-pagination">
          <button
            disabled={page <= 1 || loadingRows}
            onClick={() => setPage(1)}
          >
            First
          </button>

          <button
            disabled={page <= 1 || loadingRows}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <span>
            Page <strong>{page}</strong> of{" "}
            <strong>{totalPages}</strong>
          </span>

          <button
            disabled={page >= totalPages || loadingRows}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
            <ChevronRight size={16} />
          </button>

          <button
            disabled={page >= totalPages || loadingRows}
            onClick={() => setPage(totalPages)}
          >
            Last
          </button>
        </div>

        <p className="explorer-export-note">
          CSV export includes all records matching your applied global
          filters. It is not limited to the current page.
        </p>
      </section>
    </>
  );
}


// ============================================
// ABOUT PAGE
// ============================================

function AboutPage() {
  const capabilities = [
    {
      number: "01",
      title: "Commercial performance",
      description:
        "Evaluate revenue, profit, order volume and margin trends to understand overall business performance.",
    },
    {
      number: "02",
      title: "Product profitability",
      description:
        "Identify leading and underperforming products using revenue, units sold and profit contribution.",
    },
    {
      number: "03",
      title: "Customer analysis",
      description:
        "Compare customer contribution, order activity and average order value to understand purchasing patterns.",
    },
    {
      number: "04",
      title: "Regional performance",
      description:
        "Assess revenue and profitability across regions and states to identify geographic differences.",
    },
    {
      number: "05",
      title: "Transaction exploration",
      description:
        "Apply shared filters, search transaction records, inspect individual rows and export filtered data.",
    },
    {
      number: "06",
      title: "Business intelligence",
      description:
        "Combine SQL-based analysis and Power BI reporting with an interactive web analytics experience.",
    },
  ];

  const technologyGroups = [
    {
      category: "APPLICATION",
      tools: [
        ["React", "Component-based dashboard interface"],
        ["Vite", "Frontend development and build tooling"],
        ["Recharts", "Interactive charts and data visualisation"],
      ],
    },
    {
      category: "API & DATA",
      tools: [
        ["Python", "Application logic and data processing"],
        ["FastAPI", "REST API and dashboard data services"],
        ["Pandas", "Data cleaning, transformation and aggregation"],
      ],
    },
    {
      category: "ANALYTICS",
      tools: [
        ["SQL", "Business queries and analytical exploration"],
        ["Power BI", "Interactive reporting and visual analysis"],
      ],
    },
  ];

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-copy">
          <p className="about-kicker">THE PROJECT / RETAIL ANALYTICS</p>
          <h2>
            Retail intelligence,
            <span> built around better decisions.</span>
          </h2>
          <p className="about-lead">
            RetailIQ is an end-to-end retail analytics project that turns
            transaction-level sales data into a structured view of business
            performance. It brings data preparation, analytical querying,
            business reporting and an interactive web dashboard into one
            connected workflow.
          </p>
          <div className="about-tags">
            <span>DATA ANALYTICS</span>
            <span>BUSINESS INTELLIGENCE</span>
            <span>INTERACTIVE REPORTING</span>
          </div>
        </div>

        <div className="about-hero-panel">
          <div className="about-panel-top">
            <span>PROJECT SNAPSHOT</span>
            <Activity size={17} />
          </div>
          <div className="about-stat-primary">
            <strong>64,104</strong>
            <span>TRANSACTION RECORDS</span>
          </div>
          <div className="about-stat-divider" />
          <div className="about-stat-row">
            <div>
              <strong>2014–2018</strong>
              <span>DATA PERIOD</span>
            </div>
            <div>
              <strong>USD</strong>
              <span>REPORTING CURRENCY</span>
            </div>
          </div>
          <p className="about-panel-note">
            Based on the project’s cleaned retail sales dataset.
          </p>
        </div>
      </section>

      <section className="about-section about-overview">
        <div className="about-section-heading">
          <div>
            <p className="about-kicker">01 / PROJECT PURPOSE</p>
            <h3>One dataset. Multiple business perspectives.</h3>
          </div>
          <p>
            Designed to move beyond static summaries and make it easier to
            investigate what is happening across products, customers and
            locations.
          </p>
        </div>

        <div className="about-overview-grid">
          <article className="about-overview-main">
            <span className="about-card-label">THE APPROACH</span>
            <h4>From raw records to actionable analysis</h4>
            <p>
              The project follows a practical analytics workflow: prepare and
              structure the data, explore business questions with SQL, build
              reporting views in Power BI, and deliver an interactive React
              dashboard supported by a FastAPI backend.
            </p>
          </article>
          <article className="about-overview-side">
            <span className="about-card-label">DESIGN PRINCIPLE</span>
            <h4>Consistent analysis across every view</h4>
            <p>
              Shared filters keep the main dashboard pages aligned, so users
              can examine the same selected period, region, channel, product
              and state from different analytical angles.
            </p>
          </article>
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-heading">
          <div>
            <p className="about-kicker">02 / ANALYTICAL SCOPE</p>
            <h3>What RetailIQ helps you investigate</h3>
          </div>
          <p>
            Six connected areas cover performance monitoring, deeper analysis
            and transaction-level exploration.
          </p>
        </div>

        <div className="about-capability-grid">
          {capabilities.map((item) => (
            <article className="about-capability" key={item.number}>
              <span className="about-capability-number">{item.number}</span>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-heading">
          <div>
            <p className="about-kicker">03 / IMPLEMENTATION</p>
            <h3>Technology behind the platform</h3>
          </div>
          <p>
            Each technology has a defined role in the data, API, interface and
            reporting workflow.
          </p>
        </div>

        <div className="about-tech-grid">
          {technologyGroups.map((group) => (
            <article className="about-tech-group" key={group.category}>
              <span className="about-card-label">{group.category}</span>
              {group.tools.map(([name, purpose]) => (
                <div className="about-tech-item" key={name}>
                  <strong>{name}</strong>
                  <span>{purpose}</span>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section className="about-credits">
        <div className="about-credits-copy">
          <p className="about-kicker">04 / PROJECT CREDITS</p>
          <h3>
            Developed by <strong>Vivek Jotva</strong>
          </h3>
          <p>
            Responsible for the project’s custom implementation and
            enhancements across the analytics workflow, API integration and
            dashboard experience.
          </p>
        </div>
        <div className="about-credits-note">
          <span>ATTRIBUTION & LICENSING</span>
          <p>
            RetailIQ builds upon an MIT-licensed retail analytics starter
            project. The original project attribution and applicable licence
            terms are retained.
          </p>
        </div>
      </section>

      <div className="about-closing">
        <span>RETAILIQ</span>
        <p>Clearer analysis. More informed business decisions.</p>
      </div>
    </div>
  );
}


// ============================================
// MAIN APPLICATION
// ============================================


function App() {
  const [activePage, setActivePage] = useState("Overview");

  const [dashboard, setDashboard] = useState(null);
  const [filterOptions, setFilterOptions] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [draftFilters, setDraftFilters] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState(null);

  // Load filter options
  useEffect(() => {
    async function fetchFilters() {
      try {
        const response = await fetch(`${API}/api/filters`);

        if (!response.ok) {
          throw new Error("Unable to load filter options.");
        }

        const result = await response.json();

        setFilterOptions(result);

        const initialFilters = {
          start_date: result.date_range.start,
          end_date: result.date_range.end,
          regions: [...result.regions],
          channels: [...result.channels],
          products: [...result.products],
          states: [...result.states],
        };

        setDraftFilters(initialFilters);
        setAppliedFilters(initialFilters);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchFilters();
  }, []);

  // Load dashboard analytics whenever applied filters change
  useEffect(() => {
    if (!appliedFilters) return;

    let cancelled = false;

    async function fetchDashboard() {
      setLoading(true);
      setError("");

      try {
        const params = buildFilterParams(appliedFilters);

        const response = await fetch(
          `${API}/api/dashboard?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Unable to fetch dashboard data.");
        }

        const result = await response.json();

        if (!cancelled) {
          setDashboard(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, [appliedFilters]);

  // Update draft filters
  function updateFilter(key, value) {
    setDraftFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  // Apply filters
  function applyFilters() {
    if (!draftFilters) return;
    setAppliedFilters({ ...draftFilters });
  }

  // Reset filters
  function resetFilters() {
    if (!filterOptions) return;

    const reset = {
      start_date: filterOptions.date_range.start,
      end_date: filterOptions.date_range.end,
      regions: [...filterOptions.regions],
      channels: [...filterOptions.channels],
      products: [...filterOptions.products],
      states: [...filterOptions.states],
    };

    setDraftFilters(reset);
    setAppliedFilters(reset);
  }

  // Navigate between dashboard pages
  function navigateToPage(page) {
    setActivePage(page);

    requestAnimationFrame(() => {
      document.getElementById("workspace")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  const summary = dashboard?.summary;

  const pageDescriptions = {
    Overview: "A complete view of your retail business.",
    "Product Intelligence":
      "Understand product performance and profitability.",
    "Customer Insights":
      "Explore customer value and purchasing behaviour.",
    "Regional Analysis":
      "Compare sales performance across locations.",
    "Data Explorer":
      "Search, inspect and export transaction records.",
    About: "Learn about the RetailIQ project, its capabilities and technology.",
  };

  // Render selected dashboard page
  function renderPage() {
    if (loading && !dashboard) {
      return (
        <p className="status-message">
          Connecting to your sales database...
        </p>
      );
    }

    if (error && !dashboard) {
      return (
        <p className="status-message error-message">
          {error} Check that your FastAPI server is running on port 8000.
        </p>
      );
    }

    if (dashboard?.empty) {
      return (
        <div className="empty-state">
          <Database size={32} />
          <h3>No matching records</h3>
          <p>{dashboard.message}</p>

          <button className="filter-reset" onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      );
    }

    if (!dashboard || !summary) return null;

    switch (activePage) {
      case "Product Intelligence":
        return <ProductPage dashboard={dashboard} />;

      case "Customer Insights":
        return <CustomerPage dashboard={dashboard} />;

      case "Regional Analysis":
        return <RegionalPage dashboard={dashboard} />;

      case "Data Explorer":
        return <DataExplorerPage filters={appliedFilters} />;

      case "About":
        return <AboutPage />;

      case "Overview":
      default:
        return (
          <OverviewPage
            dashboard={dashboard}
            summary={summary}
          />
        );
    }
  }

  return (
    <div className="app-shell">

      {/* NAVIGATION */}
      <header className="topbar">
        <a
          className="brand"
          href="#workspace"
          onClick={(event) => {
            event.preventDefault();
            navigateToPage("Overview");
          }}
        >
          <span className="brand-mark">R</span>

          <span>
            Retail<span className="brand-accent">IQ</span>
          </span>
        </a>

        <nav className="navigation">
          {navigation.map((item) => (
            <button
              type="button"
              key={item}
              className={
                activePage === item
                  ? "nav-link active"
                  : "nav-link"
              }
              aria-current={
                activePage === item ? "page" : undefined
              }
              onClick={() => navigateToPage(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="live-status">
          <span className="live-dot"></span>
          ANALYTICS LIVE
        </div>
      </header>

      <main>

        {/* HERO - ONLY ON OVERVIEW */}
        {activePage === "Overview" && (
          <section className="hero">
            <div className="hero-content">
              <p className="eyebrow">
                RETAIL INTELLIGENCE PLATFORM
              </p>

              <h1>
                See the numbers.
                <br />
                <span>Understand the story.</span>
              </h1>

              <p className="hero-description">
                A unified view of sales performance, customer behaviour,
                product intelligence and business growth.
              </p>

              <button
                className="hero-button"
                onClick={() => {
                  document.getElementById("workspace")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                Explore the dashboard <ArrowUpRight size={17} />
              </button>
            </div>

            <div className="hero-visual">
              <div className="visual-topline">
                <span>BUSINESS PERFORMANCE</span>
                <span>RETAILIQ / 01</span>
              </div>

              <div className="visual-number">
                {summary
                  ? formatCompactCurrency(summary.revenue)
                  : "—"}
              </div>

              <p className="visual-caption">
                Recorded total revenue
              </p>

              <div className="visual-chart">
                <div className="chart-bars">
                  {(dashboard?.monthly || []).slice(-12).map((month) => {
                    const maxRevenue = Math.max(
                      ...(dashboard?.monthly || []).map(
                        (item) => item.revenue
                      ),
                      1
                    );

                    const height =
                      (month.revenue / maxRevenue) * 100;

                    return (
                      <span
                        key={month.month}
                        title={`${month.month}: ${formatCurrency(
                          month.revenue
                        )}`}
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="visual-bottomline">
                <span>DATA-DRIVEN DECISIONS</span>
                <span>EST. 2018</span>
              </div>
            </div>
          </section>
        )}

        {/* WORKSPACE */}
        <section className="workspace" id="workspace">

          <div className="section-heading">
            <div>
              <p className="eyebrow">
                YOUR BUSINESS AT A GLANCE
              </p>

              <h2>{activePage}</h2>

              <p className="page-subtitle">
                {pageDescriptions[activePage]}
              </p>
            </div>

            <span className="data-label">
              <Database size={14} /> LIVE DATASET
            </span>
          </div>

          {/* GLOBAL FILTERS */}
          {activePage !== "About" && filterOptions && draftFilters && (
            <section className="filter-panel">
              <div className="filter-panel-heading">
                <div>
                  <p className="eyebrow">
                    CONTROL YOUR ANALYSIS
                  </p>

                  <h3>Global Filters</h3>
                </div>

                <span>
                  FILTERS APPLY TO ALL ANALYTICS
                </span>
              </div>

              <div className="date-filters">
                <label>
                  Start date
                  <input
                    type="date"
                    min={filterOptions.date_range.start}
                    max={draftFilters.end_date}
                    value={draftFilters.start_date}
                    onChange={(event) =>
                      updateFilter("start_date", event.target.value)
                    }
                  />
                </label>

                <label>
                  End date
                  <input
                    type="date"
                    min={draftFilters.start_date}
                    max={filterOptions.date_range.end}
                    value={draftFilters.end_date}
                    onChange={(event) =>
                      updateFilter("end_date", event.target.value)
                    }
                  />
                </label>
              </div>

              <div className="filter-groups">
                <MultiSelectFilter
                  label="Region"
                  options={filterOptions.regions}
                  selected={draftFilters.regions}
                  onChange={(value) =>
                    updateFilter("regions", value)
                  }
                />

                <MultiSelectFilter
                  label="Sales Channel"
                  options={filterOptions.channels}
                  selected={draftFilters.channels}
                  onChange={(value) =>
                    updateFilter("channels", value)
                  }
                />

                <MultiSelectFilter
                  label="Products"
                  options={filterOptions.products}
                  selected={draftFilters.products}
                  onChange={(value) =>
                    updateFilter("products", value)
                  }
                />

                <MultiSelectFilter
                  label="States"
                  options={filterOptions.states}
                  selected={draftFilters.states}
                  onChange={(value) =>
                    updateFilter("states", value)
                  }
                />
              </div>

              <div className="filter-actions">
                <button
                  className="filter-reset"
                  onClick={resetFilters}
                >
                  <RefreshCw size={13} />
                  Reset filters
                </button>

                <button
                  className="filter-apply"
                  onClick={applyFilters}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Apply Filters"}
                </button>
              </div>
            </section>
          )}

          {loading && dashboard && (
            <p className="status-message">
              Updating analytics...
            </p>
          )}

          {error && dashboard && (
            <p className="status-message error-message">
              {error}
            </p>
          )}

          {/* SELECTED PAGE CONTENT */}
          {renderPage()}

          {/* DATASET INFORMATION */}
          {activePage !== "About" &&
            dashboard &&
            !dashboard.empty &&
            dashboard.dataset && (
              <div className="dataset-footer">
                <div>
                  <Database size={17} />
                  <span>
                    {formatNumber(dashboard.dataset.records)} records loaded
                  </span>
                </div>

                <span>
                  {dashboard.dataset.start_date} —{" "}
                  {dashboard.dataset.end_date}
                </span>
              </div>
            )}
        </section>
      </main>

      <footer className="footer">
        <span>RetailIQ © 2026</span>
        <span>TURNING RETAIL DATA INTO DECISIONS</span>
      </footer>
    </div>
  );
}


export default App;
