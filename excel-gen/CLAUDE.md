Build a CAV Data Report Generator CLI in Python
Project Goal:
Build a Python CLI tool that reads a Customer Acquisition & Value (CAV) Excel file, normalizes the data, performs analytics, and exports a professional report in 3 formats: PDF, DOCX, and XLSX.

Project Structure:
cav-report-generator/
├── main.py              # CLI entry point
├── normalizer.py        # Excel ingestion & data normalization
├── analyzer.py          # KPI computation & analytics
├── pdf_generator.py     # PDF report builder
├── docx_generator.js    # DOCX report builder (Node.js / docx npm)
├── xlsx_generator.py    # XLSX report builder (openpyxl)
├── chart_builder.py     # Matplotlib chart generation (saves as PNG)
├── requirements.txt
└── package.json

Tech Stack:

Python 3.10+
pandas — Excel reading & data manipulation
openpyxl — XLSX report output
reportlab — PDF generation with charts embedded
matplotlib — chart image generation
python-docx or docx npm package via Node.js subprocess — DOCX output
argparse — CLI interface


CLI Usage:
bashpython main.py --input data.xlsx --output ./reports --formats pdf docx xlsx

--input → path to CAV Excel file
--output → output directory (default: ./reports)
--formats → one or more of: pdf, docx, xlsx (default: all three)


Module 1 — normalizer.py:

Read the uploaded .xlsx using pandas
Auto-detect columns by matching common CAV column name variants (case-insensitive):

Customer ID → customer_id
Name / Customer Name → name
Acquisition Date / Date → acquisition_date (parse as datetime)
Channel / Source → channel
Revenue / Total Revenue → revenue (float)
LTV / Lifetime Value / Customer LTV → ltv (float)


Drop fully duplicate rows
Fill missing channel with "Unknown"
Fill missing revenue and ltv with 0.0
Add a month_year column derived from acquisition_date (format: "Jan 2024")
Return a clean pandas.DataFrame


Module 2 — analyzer.py:
Takes the normalized DataFrame and returns a dict with:

total_customers — count of unique customer IDs
total_revenue — sum of revenue
avg_ltv — mean LTV
top_channel — channel with highest customer count
avg_revenue_per_customer — total_revenue / total_customers
monthly_acquisitions — dict of {month_year: count} sorted chronologically
revenue_by_channel — dict of {channel: total_revenue}
ltv_by_channel — dict of {channel: avg_ltv}
top_10_customers — top 10 rows by LTV as a list of dicts


Module 3 — chart_builder.py:
Generates and saves chart PNGs to a temp /tmp/cav_charts/ directory:

bar_revenue_by_channel.png — horizontal bar chart, revenue by channel
line_monthly_acquisitions.png — line chart, monthly acquisition trend
pie_channel_distribution.png — pie chart, customer count by channel
bar_ltv_by_channel.png — bar chart, avg LTV by channel
Use a clean, professional style (seaborn-v0_8-whitegrid or ggplot)
Return dict of {chart_name: filepath}


Module 4 — pdf_generator.py:
Using reportlab (Platypus):

Page 1 — Cover: Title "CAV Analytics Report", generated date, total records count, styled header
Page 2 — KPI Dashboard: 6 KPI cards in a 2x3 grid table showing all analyzer metrics
Page 3 — Charts: Embed all 4 chart PNGs, 2 per row with captions
Page 4 — Top 10 Customers Table: Styled table with alternating row colors
Page 5 — Insights: Auto-generated rule-based text insights like:

"Top acquisition channel is X with Y% of customers"
"Average LTV is $Z"
"Highest revenue month was MMM YYYY"


Brand colors: primary #2E4057, accent #048A81


Module 5 — docx_generator.js:
Using the docx npm package:

Mirror the same 5-section structure as the PDF
Use proper Heading1/Heading2 styles
Embed charts as ImageRun (load PNGs from /tmp/cav_charts/)
KPI table using dual-width TableCell (DXA units)
US Letter page size (12240 x 15840 DXA), 1-inch margins
Never use unicode bullets — use LevelFormat.BULLET with numbering config
Save as cav_report.docx
Called from Python via subprocess.run(["node", "docx_generator.js", json_data_path])


Module 6 — xlsx_generator.py:
Using openpyxl:

Sheet 1 "Summary": KPI metrics in a styled table with bold headers, colored fills
Sheet 2 "By Channel": Revenue, LTV, customer count per channel
Sheet 3 "Monthly Trend": Month-wise acquisition count
Sheet 4 "Top Customers": Top 10 by LTV
Sheet 5 "Raw Normalized": Full cleaned dataset
Use blue headers (#2E4057), alternating row fills, auto column widths


main.py — CLI Orchestration:
python# Flow:
# 1. Parse args
# 2. Run normalizer → get clean df
# 3. Run analyzer → get stats dict
# 4. Run chart_builder → get chart paths
# 5. Serialize stats to /tmp/cav_data.json (for docx_generator.js)
# 6. Based on --formats, call respective generators
# 7. Print summary: "✅ PDF saved to reports/cav_report.pdf" etc.

Error Handling:

If input file not found → clear error message
If required columns cannot be mapped → list which ones are missing
If a format generator fails → skip it, warn, continue with others


Sample Excel columns to handle (fuzzy match these):
Customer ID, Cust ID, Name, Customer Name, Full Name, Date, Acq Date, Acquisition Date, Channel, Source, Revenue, Total Revenue, LTV, Lifetime Value, Customer LTV

requirements.txt:
pandas
openpyxl
reportlab
matplotlib
package.json:
json{ "dependencies": { "docx": "^8.5.0" } }