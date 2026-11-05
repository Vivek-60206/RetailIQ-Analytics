from pathlib import Path
from io import StringIO
from functools import lru_cache
import logging

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse


# =========================================================
# 1. APPLICATION CONFIGURATION
# =========================================================

app = FastAPI(title="RetailIQ Analytics API")
# Configure application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("retailiq")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "cleaned_sales_data.csv"
)


# =========================================================
# 2. LOAD AND PREPARE DATA
# =========================================================

@lru_cache(maxsize=1)
def load_data():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)

    required = [
        "Order_Number",
        "order_date",
        "Customer_Name",
        "channel",
        "Product_Name",
        "quantity",
        "revenue",
        "profit",
        "State_Name",
        "us_region",
    ]

    missing = [col for col in required if col not in df.columns]

    if missing:
        raise ValueError(f"Missing dataset columns: {missing}")

    df["order_date"] = pd.to_datetime(
        df["order_date"], errors="coerce"
    )

    numeric_columns = [
        "quantity", "revenue", "profit",
        "cost", "Unit_Price", "lat", "lon"
    ]

    for col in numeric_columns:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.dropna(
        subset=["order_date", "revenue", "profit"]
    )

    return df


# =========================================================
# 3. APPLY GLOBAL FILTERS
# =========================================================

def filter_data(
    df,
    start_date=None,
    end_date=None,
    regions=None,
    channels=None,
    products=None,
    states=None,
):
    filtered = df.copy()

    if start_date:
        filtered = filtered[
            filtered["order_date"].dt.date
            >= pd.to_datetime(start_date).date()
        ]

    if end_date:
        filtered = filtered[
            filtered["order_date"].dt.date
            <= pd.to_datetime(end_date).date()
        ]

    if regions:
        filtered = filtered[filtered["us_region"].isin(regions)]

    if channels:
        filtered = filtered[filtered["channel"].isin(channels)]

    if products:
        filtered = filtered[filtered["Product_Name"].isin(products)]

    if states:
        filtered = filtered[filtered["State_Name"].isin(states)]

    return filtered


# =========================================================
# 4. SHARED FILTER PARAMETERS
# =========================================================

def get_filtered_data(
    start_date=None,
    end_date=None,
    regions=None,
    channels=None,
    products=None,
    states=None,
):
    df = load_data()

    return filter_data(
        df,
        start_date,
        end_date,
        regions,
        channels,
        products,
        states,
    )


# =========================================================
# 5. HEALTH CHECK
# =========================================================

@app.get("/api/health")
def health():
    try:
        df = load_data()

        return {
            "status": "connected",
            "project": "RetailIQ",
            "records": len(df),
        }

    except Exception:
        logger.exception("An unexpected error occurred in the API endpoint.")
        raise HTTPException(
            status_code=500,
            detail="An internal server error occurred. Please try again later."
        )

# =========================================================
# 6. FILTER OPTIONS
# =========================================================

@app.get("/api/filters")
def filter_options():
    try:
        df = load_data()

        return {
            "date_range": {
                "start": df["order_date"].min().strftime("%Y-%m-%d"),
                "end": df["order_date"].max().strftime("%Y-%m-%d"),
            },
            "regions": sorted(df["us_region"].dropna().unique().tolist()),
            "channels": sorted(df["channel"].dropna().unique().tolist()),
            "products": sorted(df["Product_Name"].dropna().unique().tolist()),
            "states": sorted(df["State_Name"].dropna().unique().tolist()),
        }

    except Exception:
        logger.exception("An unexpected error occurred in the API endpoint.")
        raise HTTPException(
            status_code=500,
            detail="An internal server error occurred. Please try again later."
        )
# =========================================================
# 7. MAIN DASHBOARD ANALYTICS
# =========================================================

@app.get("/api/dashboard")
def dashboard(
    start_date: str | None = None,
    end_date: str | None = None,
    regions: list[str] | None = Query(default=None),
    channels: list[str] | None = Query(default=None),
    products: list[str] | None = Query(default=None),
    states: list[str] | None = Query(default=None),
):
    try:
        df = get_filtered_data(
            start_date, end_date,
            regions, channels, products, states
        )

        if df.empty:
            return {
                "empty": True,
                "message": "No records match the selected filters.",
                "summary": {},
                "monthly": [],
                "channels": [],
                "regions": [],
                "products": [],
                "customers": [],
                "states": [],
                "map": [],
                "observations": [],
                "dataset": {"records": 0},
            }

        # -------------------------
        # KPI CALCULATIONS
        # -------------------------

        revenue = float(df["revenue"].sum())
        profit = float(df["profit"].sum())
        orders = int(df["Order_Number"].nunique())
        customers_count = int(df["Customer_Name"].nunique())
        units = float(df["quantity"].sum())

        summary = {
            "revenue": revenue,
            "profit": profit,
            "orders": orders,
            "customers": customers_count,
            "units": units,
            "profit_margin": profit / revenue * 100 if revenue else 0,
            "average_order_value": revenue / orders if orders else 0,
            "revenue_per_customer": (
                revenue / customers_count if customers_count else 0
            ),
        }

        # -------------------------
        # MONTHLY PERFORMANCE
        # -------------------------

        monthly = (
            df.set_index("order_date")
            .resample("MS")
            .agg(
                revenue=("revenue", "sum"),
                profit=("profit", "sum"),
            )
            .reset_index()
        )

        monthly["month"] = monthly["order_date"].dt.strftime("%Y-%m")

        # -------------------------
        # CHANNEL PERFORMANCE
        # -------------------------

        channel_data = (
            df.groupby("channel", as_index=False)
            .agg(
                revenue=("revenue", "sum"),
                profit=("profit", "sum"),
                orders=("Order_Number", "nunique"),
            )
            .sort_values("revenue", ascending=False)
        )

        # -------------------------
        # REGIONAL PERFORMANCE
        # -------------------------

        region_data = (
            df.groupby("us_region", as_index=False)
            .agg(
                revenue=("revenue", "sum"),
                profit=("profit", "sum"),
                orders=("Order_Number", "nunique"),
            )
            .sort_values("revenue", ascending=False)
        )

        # -------------------------
        # PRODUCT PERFORMANCE
        # -------------------------

        product_data = (
            df.groupby("Product_Name", as_index=False)
            .agg(
                revenue=("revenue", "sum"),
                profit=("profit", "sum"),
                units=("quantity", "sum"),
            )
            .sort_values("revenue", ascending=False)
        )

        # -------------------------
        # CUSTOMER PERFORMANCE
        # -------------------------

        customer_data = (
            df.groupby("Customer_Name", as_index=False)
            .agg(
                revenue=("revenue", "sum"),
                profit=("profit", "sum"),
                orders=("Order_Number", "nunique"),
                units=("quantity", "sum"),
            )
        )

        customer_data["average_order_value"] = (
            customer_data["revenue"]
            / customer_data["orders"].replace(0, pd.NA)
        )

        customer_data = customer_data.sort_values(
            "revenue", ascending=False
        )

        # -------------------------
        # STATE PERFORMANCE
        # -------------------------

        state_data = (
            df.groupby("State_Name", as_index=False)
            .agg(
                revenue=("revenue", "sum"),
                profit=("profit", "sum"),
                orders=("Order_Number", "nunique"),
            )
            .sort_values("revenue", ascending=False)
        )

        # -------------------------
        # GEOGRAPHIC DATA
        # -------------------------

        map_data = []

        if {"lat", "lon"}.issubset(df.columns):
            geographic = df.dropna(subset=["lat", "lon"])

            if not geographic.empty:
                geographic = (
                    geographic.groupby(
                        ["State_Name", "lat", "lon"],
                        as_index=False
                    )
                    .agg(revenue=("revenue", "sum"))
                )

                map_data = geographic.to_dict("records")

        # -------------------------
        # BUSINESS OBSERVATIONS
        # -------------------------

        observations = []

        if not region_data.empty:
            observations.append({
                "title": "Leading Region",
                "value": region_data.iloc[0]["us_region"],
                "description": "Highest revenue among selected regions.",
            })

        if not channel_data.empty:
            observations.append({
                "title": "Leading Channel",
                "value": channel_data.iloc[0]["channel"],
                "description": "Highest revenue among selected sales channels.",
            })

        if not product_data.empty:
            observations.append({
                "title": "Top Product",
                "value": product_data.iloc[0]["Product_Name"],
                "description": "Highest revenue among selected products.",
            })

        return {
            "empty": False,
            "summary": summary,
            "monthly": monthly[
                ["month", "revenue", "profit"]
            ].to_dict("records"),
            "channels": channel_data.to_dict("records"),
            "regions": region_data.to_dict("records"),
            "products": product_data.to_dict("records"),
            "customers": customer_data.to_dict("records"),
            "states": state_data.to_dict("records"),
            "map": map_data,
            "observations": observations,
            "dataset": {
                "records": len(df),
                "start_date": df["order_date"].min().strftime("%Y-%m-%d"),
                "end_date": df["order_date"].max().strftime("%Y-%m-%d"),
                "columns": len(df.columns),
            },
        }

    except Exception:
        logger.exception("An unexpected error occurred in the API endpoint.")
        raise HTTPException(
            status_code=500,
            detail="An internal server error occurred. Please try again later."
        )
# =========================================================
# 8. TRANSACTION DATA EXPLORER
# =========================================================

@app.get("/api/transactions")
def transactions(
    start_date: str | None = None,
    end_date: str | None = None,
    regions: list[str] | None = Query(default=None),
    channels: list[str] | None = Query(default=None),
    products: list[str] | None = Query(default=None),
    states: list[str] | None = Query(default=None),
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=500),
):
    try:
        df = get_filtered_data(
            start_date, end_date,
            regions, channels, products, states
        )

        if search:
            search_columns = [
                "Order_Number",
                "Customer_Name",
                "Product_Name",
                "State_Name",
                "channel",
                "us_region",
            ]

            mask = pd.Series(False, index=df.index)

            for col in search_columns:
                mask |= df[col].astype(str).str.contains(
                    search, case=False, na=False
                )

            df = df[mask]

        total = len(df)
        start = (page - 1) * page_size
        end = start + page_size

        records = df.copy()
        records["order_date"] = records["order_date"].dt.strftime("%Y-%m-%d")
        records = records.astype(object).where(pd.notna(records), None)

        return {
            "records": records.iloc[start:end].to_dict("records"),
            "total_records": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
        }

    except Exception:
        logger.exception("An unexpected error occurred in the API endpoint.")
        raise HTTPException(
            status_code=500,
            detail="An internal server error occurred. Please try again later."
        )
# =========================================================
# 9. FILTERED CSV EXPORT
# =========================================================

@app.get("/api/export")
def export_csv(
    start_date: str | None = None,
    end_date: str | None = None,
    regions: list[str] | None = Query(default=None),
    channels: list[str] | None = Query(default=None),
    products: list[str] | None = Query(default=None),
    states: list[str] | None = Query(default=None),
):
    try:
        df = get_filtered_data(
            start_date, end_date,
            regions, channels, products, states
        )

        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)

        return StreamingResponse(
            iter([csv_buffer.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition":
                    "attachment; filename=retailiq_filtered_data.csv"
            },
        )

    except Exception:
        logger.exception("An unexpected error occurred in the API endpoint.")
        raise HTTPException(
            status_code=500,
            detail="An internal server error occurred. Please try again later."
        )
