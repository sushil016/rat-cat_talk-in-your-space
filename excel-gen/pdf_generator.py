from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Dict, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


PRIMARY = colors.HexColor("#2E4057")
ACCENT = colors.HexColor("#048A81")


def _currency(value: float) -> str:
    return f"${value:,.2f}"


def _build_insights(stats: Dict[str, object]) -> List[str]:
    insights: List[str] = []

    total_customers = stats.get("total_customers", 0) or 0
    top_channel = str(stats.get("top_channel", "N/A"))
    channel_counts = stats.get("customer_count_by_channel", {})
    top_channel_count = channel_counts.get(top_channel, 0) if isinstance(channel_counts, dict) else 0
    top_channel_pct = (top_channel_count / total_customers * 100) if total_customers else 0
    insights.append(
        f"Top acquisition channel is {top_channel} with {top_channel_pct:.1f}% of customers."
    )

    avg_ltv = float(stats.get("avg_ltv", 0.0))
    insights.append(f"Average LTV is {_currency(avg_ltv)}.")

    revenue_by_month = stats.get("monthly_acquisitions", {})
    if isinstance(revenue_by_month, dict) and revenue_by_month:
        highest_month = max(revenue_by_month, key=revenue_by_month.get)
        insights.append(f"Highest acquisition month was {highest_month}.")
    else:
        insights.append("No monthly acquisition trend was available.")

    return insights


def generate_pdf_report(
    stats: Dict[str, object],
    chart_paths: Dict[str, str],
    output_dir: str,
) -> str:
    output_path = str(Path(output_dir) / "cav_report.pdf")
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Page 1: Cover
    title = Paragraph('<font size=28 color="#2E4057"><b>CAV Analytics Report</b></font>', styles["Title"])
    story.extend(
        [
            Spacer(1, 120),
            title,
            Spacer(1, 24),
            Paragraph(
                f'Generated: <font color="#048A81">{datetime.now().strftime("%Y-%m-%d %H:%M")}</font>',
                styles["Normal"],
            ),
            Spacer(1, 12),
            Paragraph(
                f'Total records: <font color="#048A81">{stats.get("total_customers", 0)}</font>',
                styles["Normal"],
            ),
            PageBreak(),
        ]
    )

    # Page 2: KPI dashboard
    kpi_rows = [
        ["Total Customers", f'{stats.get("total_customers", 0)}'],
        ["Total Revenue", _currency(float(stats.get("total_revenue", 0.0)))],
        ["Average LTV", _currency(float(stats.get("avg_ltv", 0.0)))],
        ["Top Channel", f'{stats.get("top_channel", "N/A")}'],
        ["Avg Revenue / Customer", _currency(float(stats.get("avg_revenue_per_customer", 0.0)))],
        ["Tracked Months", str(len(stats.get("monthly_acquisitions", {})))],
    ]
    kpi_table_data = [kpi_rows[0:2], kpi_rows[2:4], kpi_rows[4:6]]
    flattened = [[f"{a[0]}: {a[1]}", f"{b[0]}: {b[1]}"] for a, b in kpi_table_data]
    table = Table(flattened, colWidths=[270, 270])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke),
                ("TEXTCOLOR", (0, 0), (-1, -1), PRIMARY),
                ("GRID", (0, 0), (-1, -1), 1, colors.lightgrey),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                ("PADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    story.extend([Paragraph("KPI Dashboard", styles["Heading1"]), Spacer(1, 12), table, PageBreak()])

    # Page 3: Charts
    story.extend([Paragraph("Charts", styles["Heading1"]), Spacer(1, 10)])
    chart_order = [
        ("bar_revenue_by_channel", "Revenue by Channel"),
        ("line_monthly_acquisitions", "Monthly Acquisitions"),
        ("pie_channel_distribution", "Channel Distribution"),
        ("bar_ltv_by_channel", "LTV by Channel"),
    ]
    for key, caption in chart_order:
        path = chart_paths.get(key)
        if path and Path(path).exists():
            story.extend([Paragraph(caption, styles["Heading3"]), Image(path, width=260, height=160), Spacer(1, 8)])
    story.append(PageBreak())

    # Page 4: Top 10
    story.extend([Paragraph("Top 10 Customers by LTV", styles["Heading1"]), Spacer(1, 12)])
    rows = [["Customer ID", "Name", "Channel", "Revenue", "LTV", "Month"]]
    for row in stats.get("top_10_customers", []):
        rows.append(
            [
                str(row.get("customer_id", "")),
                str(row.get("name", "")),
                str(row.get("channel", "")),
                _currency(float(row.get("revenue", 0.0))),
                _currency(float(row.get("ltv", 0.0))),
                str(row.get("month_year", "Unknown")),
            ]
        )
    top_table = Table(rows, repeatRows=1)
    top_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F7FA")]),
            ]
        )
    )
    story.extend([top_table, PageBreak()])

    # Page 5: Insights
    story.extend([Paragraph("Insights", styles["Heading1"]), Spacer(1, 10)])
    for item in _build_insights(stats):
        story.append(Paragraph(f'<font color="#048A81">-</font> {item}', styles["Normal"]))
        story.append(Spacer(1, 8))

    doc.build(story)
    return output_path
