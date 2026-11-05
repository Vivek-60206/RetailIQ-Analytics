
from pathlib import Path

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st


# =========================================================
# 1. PAGE CONFIGURATION
# =========================================================

st.set_page_config(
    page_title="RetailIQ | Business Intelligence",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)


# =========================================================
# 2. DESIGN
# =========================================================

st.markdown("""


<style>
    /* =====================================
       RETAILIQ — PREMIUM COFFEE PALETTE
       ===================================== */

    :root {
        --champagne: #EACCAA;
        --honey: #874016;
        --whiskey: #CC9C54;
        --coffee: #371911;
        --balsamico: #160C0A;
        --cream-muted: #CBB49E;
        --card: #28130F;
    }

    /* Main application */
    .stApp {
        background-color: var(--balsamico);
        color: var(--champagne);
        font-family: "Aptos", "Segoe UI", sans-serif;
    }

    /* Streamlit top header — blend into the website */
header[data-testid="stHeader"] {
    background: var(--balsamico) !important;
    border-bottom: 1px solid rgba(234, 204, 170, 0.10);
}

[data-testid="stToolbar"] {
    background: transparent !important;
}

[data-testid="stDecoration"] {
    display: none;
}

    /* Main content spacing */
    .block-container {
        padding-top: 4rem;
        padding-bottom: 2rem;
        max-width: 1450px;
    }

    /* Sidebar */
    [data-testid="stSidebar"] {
        background-color: var(--coffee);
        border-right: 1px solid #60402D;
    }

    [data-testid="stSidebar"] * {
        color: var(--champagne);
    }

    /* Headings */
    h1, h2, h3 {
        color: var(--champagne);
        font-family: Georgia, "Times New Roman", serif;
        font-weight: 500;
        letter-spacing: 0.3px;
    }

    h1 {
        font-size: 2.2rem;
    }

    /* Body text */
    p, label, .stMarkdown {
        color: var(--cream-muted);
    }

    .subtitle {
        color: var(--whiskey);
        font-size: 15px;
        letter-spacing: 0.5px;
    }

    /* KPI cards */
    [data-testid="stMetric"] {
        background-color: var(--card);
        border: 1px solid #60402D;
        border-radius: 8px;
        padding: 18px 20px;
    }

    [data-testid="stMetricLabel"] {
        color: var(--cream-muted);
        font-size: 13px;
    }

    [data-testid="stMetricValue"] {
        color: var(--champagne);
        font-family: Georgia, serif;
    }

    [data-testid="stMetricDelta"] {
        color: var(--whiskey);
    }

    /* Tabs */
    div[data-testid="stTabs"] button {
        color: var(--cream-muted);
        font-weight: 500;
    }

    div[data-testid="stTabs"] button[aria-selected="true"] {
        color: var(--champagne);
        border-bottom-color: var(--whiskey);
    }

    /* Insight panels */
    .insight {
        background-color: var(--coffee);
        border-left: 3px solid var(--whiskey);
        border-radius: 5px;
        padding: 14px;
        margin-bottom: 10px;
    }

    /* Inputs */
    [data-testid="stSelectbox"],
    [data-testid="stMultiSelect"],
    [data-testid="stDateInput"] {
        color: var(--champagne);
    }

    /* Buttons */
    .stButton button,
    .stDownloadButton button {
        background-color: var(--honey);
        color: var(--champagne);
        border: 1px solid var(--whiskey);
        border-radius: 6px;
        transition: background-color 0.2s ease;
    }

    .stButton button:hover,
    .stDownloadButton button:hover {
        background-color: #A45B27;
        color: #FFFFFF;
        border-color: var(--champagne);
    }

    /* Data tables */
    [data-testid="stDataFrame"] {
        border: 1px solid #60402D;
        border-radius: 7px;
    }

    /* Dividers */
    hr {
        border-color: #60402D;
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
        width: 7px;
    }

    ::-webkit-scrollbar-thumb {
        background: #80502F;
        border-radius: 8px;
    }

</style>


""", unsafe_allow_html=True)


# =========================================================
# 3. LOAD DATA
# =========================================================

@st.cache_data
def load_data():
    root = Path(__file__).resolve().parent.parent
    file_path = root / "data" / "cleaned_sales_data.csv"

    if not file_path.exists():
        raise FileNotFoundError(
            f"Dataset not found: {file_path}"
        )

    data = pd.read_csv(file_path)

    required_columns = [
        "Order_Number", "order_date", "Customer_Name",
        "channel", "Product_Name", "quantity",
        "revenue", "profit", "State_Name", "us_region"
    ]

    missing = [
        col for col in required_columns
        if col not in data.columns
    ]

    if missing:
        raise ValueError(
            f"Required columns are missing: {missing}"
        )

    data["order_date"] = pd.to_datetime(
        data["order_date"], errors="coerce"
    )

    numeric_columns = [
        "quantity", "revenue", "profit",
        "cost", "Unit_Price", "lat", "lon"
    ]

    for col in numeric_columns:
        if col in data.columns:
            data[col] = pd.to_numeric(
                data[col], errors="coerce"
            )

    data = data.dropna(
        subset=["order_date", "revenue", "profit"]
    )

    return data


try:
    df = load_data()
except Exception as error:
    st.error(f"Unable to load the dataset: {error}")
    st.stop()


# =========================================================
# 4. SIDEBAR FILTERS
# =========================================================

st.sidebar.title("RETAILIQ")
st.sidebar.caption("Business Intelligence Platform")
st.sidebar.caption("Developed By Vivek Jotva")
st.sidebar.divider()

st.sidebar.subheader("Analysis Filters")

min_date = df["order_date"].min().date()
max_date = df["order_date"].max().date()

date_range = st.sidebar.date_input(
    "Order Date Range",
    value=(min_date, max_date),
    min_value=min_date,
    max_value=max_date
)

regions = sorted(df["us_region"].dropna().unique())

selected_regions = st.sidebar.multiselect(
    "Region",
    regions,
    default=regions
)

channels = sorted(df["channel"].dropna().unique())

selected_channels = st.sidebar.multiselect(
    "Sales Channel",
    channels,
    default=channels
)

products = sorted(df["Product_Name"].dropna().unique())

selected_products = st.sidebar.multiselect(
    "Products",
    products
)

states = sorted(df["State_Name"].dropna().unique())

selected_states = st.sidebar.multiselect(
    "States",
    states,
    default=states
)

st.sidebar.divider()
st.sidebar.caption("RetailIQ | Analytics Workspace")


# =========================================================
# 5. FILTER DATA
# =========================================================

filtered = df.copy()

if isinstance(date_range, (tuple, list)) and len(date_range) == 2:
    start_date, end_date = date_range

    filtered = filtered[
        (filtered["order_date"].dt.date >= start_date)
        & (filtered["order_date"].dt.date <= end_date)
    ]

filtered = filtered[
    filtered["us_region"].isin(selected_regions)
    & filtered["channel"].isin(selected_channels)
    & filtered["State_Name"].isin(selected_states)
]

if selected_products:
    filtered = filtered[
        filtered["Product_Name"].isin(selected_products)
    ]

if filtered.empty:
    st.warning("No records match the selected filters.")
    st.stop()


# =========================================================
# 6. HELPER FUNCTIONS
# =========================================================

def money(value):
    if abs(value) >= 1_000_000:
        return f"${value / 1_000_000:.2f}M"
    if abs(value) >= 1_000:
        return f"${value / 1_000:.1f}K"
    return f"${value:,.2f}"


def chart_layout(fig, height=380):
    fig.update_layout(
        height=height,
        template="plotly_dark",
        paper_bgcolor="#0b1120",
        plot_bgcolor="#111827",
        font=dict(color="#e5e7eb"),
        margin=dict(l=20, r=20, t=60, b=20),
        legend_title_text=""
    )
    return fig


# =========================================================
# 7. CALCULATE KPIs
# =========================================================

revenue = filtered["revenue"].sum()
profit = filtered["profit"].sum()

orders = filtered["Order_Number"].nunique()
customers = filtered["Customer_Name"].nunique()

quantity = filtered["quantity"].sum()

average_order = revenue / orders if orders else 0
profit_margin = profit / revenue * 100 if revenue else 0

# =========================================================
# 8. HEADER
# =========================================================


st.html("""
<div class="hero-section">

    <div class="hero-brand">
        <div class="brand-mark">
            <svg viewBox="0 0 64 64" fill="none"
                 xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22H52L48 55H16L12 22Z"
                      stroke="#EACCAA" stroke-width="2.5"
                      stroke-linejoin="round"/>
                <path d="M23 23V17C23 12 27 8 32 8C37 8 41 12 41 17V23"
                      stroke="#CC9C54" stroke-width="2.5"
                      stroke-linecap="round"/>
                <path d="M21 43L28 36L34 40L44 29"
                      stroke="#CC9C54" stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"/>
                <path d="M39 29H44V34"
                      stroke="#CC9C54" stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"/>
            </svg>
        </div>

        <div>
            <div class="hero-eyebrow">
                RETAIL BUSINESS INTELLIGENCE
            </div>
            <h1 class="hero-title">
                Retail<span>IQ</span>
            </h1>
            <p class="hero-tagline">
                Intelligence behind every transaction.
            </p>
        </div>
    </div>

    <div class="hero-description">
        <p>
            Discover the story behind your sales.
            Explore revenue, profitability, customer behavior
            and product performance through intelligent analytics.
        </p>
    </div>

    <div class="hero-divider"></div>

</div>
""")

st.divider()


# =========================================================
# 9. KPI CARDS
# =========================================================

k1, k2, k3, k4 = st.columns(4)

k1.metric("Total Revenue", money(revenue))
k2.metric("Total Profit", money(profit))
k3.metric("Total Orders", f"{orders:,}")
k4.metric("Profit Margin", f"{profit_margin:.2f}%")

k5, k6, k7, k8 = st.columns(4)

k5.metric("Customers", f"{customers:,}")
k6.metric("Units Sold", f"{quantity:,.0f}")
k7.metric("Average Order Value", money(average_order))
k8.metric(
    "Revenue / Customer",
    money(revenue / customers if customers else 0)
)

st.divider()



# =========================================================
# RETAILIQ — CUSTOM NAVIGATION
# =========================================================

if "active_page" not in st.session_state:
    st.session_state.active_page = "Overview"

st.markdown("""
<div class="retailiq-header">
    <div class="brand">
        <span class="brand-name">RetailIQ</span>
        <span class="brand-tagline">RETAIL INTELLIGENCE PLATFORM</span>
    </div>
    <div class="header-status">
        BUSINESS ANALYTICS
    </div>
</div>
""", unsafe_allow_html=True)

nav_items = [
    "Overview",
    "Product Intelligence",
    "Customer Insights",
    "Regional Analysis",
    "Data Explorer"
]

nav_cols = st.columns(5)

for i, page in enumerate(nav_items):
    with nav_cols[i]:
        if st.button(
            page,
            key=f"nav_{i}",
            use_container_width=True,
            type="primary" if st.session_state.active_page == page else "secondary"
        ):
            st.session_state.active_page = page
            st.rerun()

active_page = st.session_state.active_page
st.divider()


# =========================================================
# TAB 1: OVERVIEW
# =========================================================

if active_page == "Overview":

    st.subheader("Sales Performance Overview")

    monthly = (
        filtered
        .set_index("order_date")
        .resample("MS")
        .agg(
            Revenue=("revenue", "sum"),
            Profit=("profit", "sum")
        )
        .reset_index()
    )

    left, right = st.columns(2)

    with left:
        fig = px.line(
            monthly,
            x="order_date",
            y="Revenue",
            markers=True,
            title="Monthly Revenue Trend"
        )
        st.plotly_chart(
            chart_layout(fig), use_container_width=True
        )

    with right:
        fig = px.line(
            monthly,
            x="order_date",
            y="Profit",
            markers=True,
            title="Monthly Profit Trend"
        )
        st.plotly_chart(
            chart_layout(fig), use_container_width=True
        )

    channel_data = (
        filtered.groupby("channel")["revenue"]
        .sum()
        .reset_index()
    )

    region_data = (
        filtered.groupby("us_region")["revenue"]
        .sum()
        .reset_index()
        .sort_values("revenue", ascending=False)
    )

    left, right = st.columns(2)

    with left:
        fig = px.pie(
            channel_data,
            names="channel",
            values="revenue",
            hole=0.55,
            title="Revenue Contribution by Channel"
        )
        st.plotly_chart(
            chart_layout(fig), use_container_width=True
        )

    with right:
        fig = px.bar(
            region_data,
            x="us_region",
            y="revenue",
            color="revenue",
            title="Revenue by Region"
        )
        st.plotly_chart(
            chart_layout(fig), use_container_width=True
        )


# =========================================================
# TAB 2: PRODUCT INTELLIGENCE
# =========================================================

if active_page == "Product Intelligence":

    st.subheader("Product Performance Analysis")

    product_data = (
        filtered.groupby("Product_Name")
        .agg(
            Revenue=("revenue", "sum"),
            Profit=("profit", "sum"),
            Units=("quantity", "sum")
        )
        .reset_index()
    )

    left, right = st.columns(2)

    top_products = product_data.nlargest(10, "Revenue")
    bottom_products = product_data.nsmallest(10, "Revenue")

    with left:
        fig = px.bar(
            top_products.sort_values("Revenue"),
            x="Revenue",
            y="Product_Name",
            orientation="h",
            color="Profit",
            title="Top 10 Products by Revenue",
            hover_data=["Units"]
        )
        st.plotly_chart(
            chart_layout(fig), use_container_width=True
        )

    with right:
        fig = px.bar(
            bottom_products.sort_values("Revenue"),
            x="Revenue",
            y="Product_Name",
            orientation="h",
            color="Profit",
            title="Bottom 10 Products by Revenue"
        )
        st.plotly_chart(
            chart_layout(fig), use_container_width=True
        )

    st.subheader("Product Performance Details")

    st.dataframe(
        product_data.sort_values(
            "Revenue", ascending=False
        ),
        use_container_width=True,
        hide_index=True
    )


# =========================================================
# TAB 3: CUSTOMER INSIGHTS
# =========================================================

if active_page == "Customer Insights":

    st.subheader("Customer Performance Analysis")

    customer_data = (
        filtered.groupby("Customer_Name")
        .agg(
            Revenue=("revenue", "sum"),
            Profit=("profit", "sum"),
            Orders=("Order_Number", "nunique")
        )
        .reset_index()
    )

    customer_data["Average Order Value"] = (
        customer_data["Revenue"]
        / customer_data["Orders"].replace(0, pd.NA)
    )

    left, right = st.columns(2)

    with left:
        top_customers = customer_data.nlargest(10, "Revenue")

        fig = px.bar(
            top_customers.sort_values("Revenue"),
            x="Revenue",
            y="Customer_Name",
            orientation="h",
            title="Top 10 Customers by Revenue",
            color="Profit"
        )
        st.plotly_chart(
            chart_layout(fig), use_container_width=True
        )

    with right:
        fig = px.scatter(
            customer_data,
            x="Orders",
            y="Revenue",
            size="Profit",
            hover_name="Customer_Name",
            title="Customer Revenue vs Order Frequency"
        )
        st.plotly_chart(
            chart_layout(fig), use_container_width=True
        )

    st.subheader("Customer Details")

    st.dataframe(
        customer_data.sort_values(
            "Revenue", ascending=False
        ),
        use_container_width=True,
        hide_index=True
    )


# =========================================================
# TAB 4: REGIONAL ANALYSIS
# =========================================================

if active_page == "Regional Analysis":

    st.subheader("Geographic Sales Performance")

    region_data = (
        filtered.groupby("us_region")
        .agg(
            Revenue=("revenue", "sum"),
            Profit=("profit", "sum"),
            Orders=("Order_Number", "nunique")
        )
        .reset_index()
    )

    left, right = st.columns(2)

    with left:
        fig = px.bar(
            region_data,
            x="us_region",
            y="Revenue",
            color="Revenue",
            title="Revenue by Region"
        )
        st.plotly_chart(
            chart_layout(fig), use_container_width=True
        )

    with right:
        fig = px.bar(
            region_data,
            x="us_region",
            y="Profit",
            color="Profit",
            title="Profit by Region"
        )
        st.plotly_chart(
            chart_layout(fig), use_container_width=True
        )

    state_data = (
        filtered.groupby("State_Name")
        .agg(
            Revenue=("revenue", "sum"),
            Profit=("profit", "sum")
        )
        .reset_index()
    )

    left, right = st.columns(2)

    with left:
        fig = px.bar(
            state_data.nlargest(10, "Revenue").sort_values("Revenue"),
            x="Revenue",
            y="State_Name",
            orientation="h",
            title="Top 10 States by Revenue"
        )
        st.plotly_chart(
            chart_layout(fig), use_container_width=True
        )

    with right:
        fig = px.bar(
            state_data.nsmallest(10, "Revenue").sort_values("Revenue"),
            x="Revenue",
            y="State_Name",
            orientation="h",
            title="Bottom 10 States by Revenue"
        )
        st.plotly_chart(
            chart_layout(fig), use_container_width=True
        )

    if {"lat", "lon"}.issubset(filtered.columns):
        map_data = (
            filtered.dropna(subset=["lat", "lon"])
            .groupby(["State_Name", "lat", "lon"])["revenue"]
            .sum()
            .reset_index()
        )

        if not map_data.empty:
            fig = px.scatter_map(
                map_data,
                lat="lat",
                lon="lon",
                size="revenue",
                color="revenue",
                hover_name="State_Name",
                zoom=2.5,
                title="Revenue Distribution Across States"
            )
            st.plotly_chart(
                chart_layout(fig, 500),
                use_container_width=True
            )


# =========================================================
# TAB 5: DATA EXPLORER
# =========================================================

if active_page == "Data Explorer":

    st.subheader("Filtered Transaction Data")

    st.write(
        f"Showing **{len(filtered):,}** records "
        f"from the selected filters."
    )

    st.dataframe(
        filtered,
        use_container_width=True,
        height=450
    )

    csv = filtered.to_csv(index=False).encode("utf-8")

    st.download_button(
        label="Download Filtered CSV",
        data=csv,
        file_name="retailiq_filtered_data.csv",
        mime="text/csv"
    )

    st.subheader("Dataset Summary")

    st.write(f"Rows: {len(filtered):,}")
    st.write(f"Columns: {len(filtered.columns)}")
    st.write(
        f"Date range: {filtered['order_date'].min().date()} "
        f"to {filtered['order_date'].max().date()}"
    )


# =========================================================
# 11. AUTOMATED BUSINESS OBSERVATIONS
# =========================================================

st.divider()
st.subheader("Business Observations")

best_region = (
    filtered.groupby("us_region")["revenue"]
    .sum()
    .idxmax()
)

best_channel = (
    filtered.groupby("channel")["revenue"]
    .sum()
    .idxmax()
)

best_product = (
    filtered.groupby("Product_Name")["revenue"]
    .sum()
    .idxmax()
)

st.markdown(
    f'<div class="insight">'
    f'<b>Leading Region:</b> {best_region} '
    f'generates the highest revenue in the current selection.'
    f'</div>',
    unsafe_allow_html=True
)

st.markdown(
    f'<div class="insight">'
    f'<b>Leading Channel:</b> {best_channel} '
    f'is the strongest sales channel by revenue.'
    f'</div>',
    unsafe_allow_html=True
)

st.markdown(
    f'<div class="insight">'
    f'<b>Top Product:</b> {best_product} '
    f'has the highest revenue in the current selection.'
    f'</div>',
    unsafe_allow_html=True
)


# =========================================================
# 12. FOOTER
# =========================================================

st.divider()

st.caption(
    "RetailIQ | Retail Business Intelligence & Decision Support System"
)

st.caption(
    "Developed as a portfolio analytics project."
)
