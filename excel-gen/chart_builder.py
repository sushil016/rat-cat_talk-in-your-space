from __future__ import annotations

from pathlib import Path
from typing import Dict

import matplotlib.pyplot as plt


CHART_DIR = Path("/tmp/cav_charts")


def generate_charts(stats: Dict[str, object]) -> Dict[str, str]:
    CHART_DIR.mkdir(parents=True, exist_ok=True)
    plt.style.use("seaborn-v0_8-whitegrid")

    paths: Dict[str, str] = {}

    revenue_by_channel = stats.get("revenue_by_channel", {})
    ltv_by_channel = stats.get("ltv_by_channel", {})
    customer_count_by_channel = stats.get("customer_count_by_channel", {})
    monthly_acquisitions = stats.get("monthly_acquisitions", {})

    # Revenue by channel (horizontal bar)
    fig, ax = plt.subplots(figsize=(9, 5))
    channels = list(revenue_by_channel.keys())
    revenues = list(revenue_by_channel.values())
    ax.barh(channels, revenues, color="#2E4057")
    ax.set_title("Revenue by Channel")
    ax.set_xlabel("Revenue")
    revenue_path = CHART_DIR / "bar_revenue_by_channel.png"
    fig.tight_layout()
    fig.savefig(revenue_path, dpi=180)
    plt.close(fig)
    paths["bar_revenue_by_channel"] = str(revenue_path)

    # Monthly acquisitions (line)
    fig, ax = plt.subplots(figsize=(10, 5))
    months = list(monthly_acquisitions.keys())
    counts = list(monthly_acquisitions.values())
    ax.plot(months, counts, marker="o", linewidth=2, color="#048A81")
    ax.set_title("Monthly Acquisition Trend")
    ax.set_xlabel("Month")
    ax.set_ylabel("Customers")
    ax.tick_params(axis="x", rotation=30)
    monthly_path = CHART_DIR / "line_monthly_acquisitions.png"
    fig.tight_layout()
    fig.savefig(monthly_path, dpi=180)
    plt.close(fig)
    paths["line_monthly_acquisitions"] = str(monthly_path)

    # Channel distribution (pie)
    fig, ax = plt.subplots(figsize=(7, 7))
    dist_labels = list(customer_count_by_channel.keys()) or ["No Data"]
    dist_sizes = list(customer_count_by_channel.values()) or [1]
    ax.pie(
        dist_sizes,
        labels=dist_labels,
        autopct="%1.1f%%",
        startangle=90,
        wedgeprops={"linewidth": 1, "edgecolor": "white"},
    )
    ax.set_title("Customer Distribution by Channel")
    pie_path = CHART_DIR / "pie_channel_distribution.png"
    fig.tight_layout()
    fig.savefig(pie_path, dpi=180)
    plt.close(fig)
    paths["pie_channel_distribution"] = str(pie_path)

    # LTV by channel (bar)
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.bar(list(ltv_by_channel.keys()), list(ltv_by_channel.values()), color="#7D8597")
    ax.set_title("Average LTV by Channel")
    ax.set_ylabel("Average LTV")
    ax.tick_params(axis="x", rotation=30)
    ltv_path = CHART_DIR / "bar_ltv_by_channel.png"
    fig.tight_layout()
    fig.savefig(ltv_path, dpi=180)
    plt.close(fig)
    paths["bar_ltv_by_channel"] = str(ltv_path)

    return paths
