from __future__ import annotations

from collections import OrderedDict
from typing import Dict, List

import pandas as pd


def _sort_month_year(monthly_series: pd.Series) -> OrderedDict:
    unknown_count = monthly_series.get("Unknown", 0)
    known = monthly_series.drop(labels=["Unknown"], errors="ignore")
    ordered = OrderedDict()

    if not known.empty:
        dt_idx = pd.to_datetime(known.index, format="%b %Y", errors="coerce")
        known_df = pd.DataFrame({"month": known.index, "count": known.values, "dt": dt_idx})
        known_df = known_df.sort_values(by="dt")
        for _, row in known_df.iterrows():
            ordered[str(row["month"])] = int(row["count"])

    if unknown_count:
        ordered["Unknown"] = int(unknown_count)
    return ordered


def compute_kpis(df: pd.DataFrame) -> Dict[str, object]:
    total_customers = int(df["customer_id"].nunique())
    total_revenue = float(df["revenue"].sum())
    avg_ltv = float(df["ltv"].mean()) if not df.empty else 0.0

    channel_counts = df["channel"].value_counts()
    top_channel = channel_counts.index[0] if not channel_counts.empty else "N/A"

    avg_revenue_per_customer = total_revenue / total_customers if total_customers else 0.0

    monthly_acquisitions_series = df["month_year"].value_counts()
    monthly_acquisitions = _sort_month_year(monthly_acquisitions_series)

    revenue_by_channel = (
        df.groupby("channel", dropna=False)["revenue"].sum().sort_values(ascending=False)
    )
    ltv_by_channel = (
        df.groupby("channel", dropna=False)["ltv"].mean().sort_values(ascending=False)
    )
    customer_count_by_channel = (
        df.groupby("channel", dropna=False)["customer_id"].nunique().sort_values(ascending=False)
    )

    top_10 = df.sort_values(by="ltv", ascending=False).head(10)
    top_10_customers: List[Dict[str, object]] = top_10[
        ["customer_id", "name", "channel", "revenue", "ltv", "month_year"]
    ].to_dict(orient="records")

    return {
        "total_customers": total_customers,
        "total_revenue": total_revenue,
        "avg_ltv": avg_ltv,
        "top_channel": top_channel,
        "avg_revenue_per_customer": avg_revenue_per_customer,
        "monthly_acquisitions": dict(monthly_acquisitions),
        "revenue_by_channel": {k: float(v) for k, v in revenue_by_channel.items()},
        "ltv_by_channel": {k: float(v) for k, v in ltv_by_channel.items()},
        "customer_count_by_channel": {k: int(v) for k, v in customer_count_by_channel.items()},
        "top_10_customers": top_10_customers,
    }
