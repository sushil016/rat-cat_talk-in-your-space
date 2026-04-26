const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ImageRun,
  LevelFormat,
} = require("docx");

function currency(v) {
  const n = Number(v || 0);
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function createKpiTable(stats) {
  const rows = [
    ["Total Customers", String(stats.total_customers || 0)],
    ["Total Revenue", currency(stats.total_revenue)],
    ["Average LTV", currency(stats.avg_ltv)],
    ["Top Channel", String(stats.top_channel || "N/A")],
    ["Avg Revenue / Customer", currency(stats.avg_revenue_per_customer)],
    ["Tracked Months", String(Object.keys(stats.monthly_acquisitions || {}).length)],
  ];

  const tableRows = [];
  for (let i = 0; i < rows.length; i += 2) {
    const left = rows[i];
    const right = rows[i + 1];
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 4500, type: WidthType.DXA },
            children: [new Paragraph(`${left[0]}: ${left[1]}`)],
          }),
          new TableCell({
            width: { size: 4500, type: WidthType.DXA },
            children: [new Paragraph(`${right[0]}: ${right[1]}`)],
          }),
        ],
      })
    );
  }

  return new Table({ width: { size: 9000, type: WidthType.DXA }, rows: tableRows });
}

function imageParagraph(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return new Paragraph("Chart not found.");
  }
  const image = fs.readFileSync(filePath);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new ImageRun({ data: image, transformation: { width: 450, height: 280 } })],
  });
}

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath || !fs.existsSync(jsonPath)) {
    throw new Error("Usage: node docx_generator.js <json-data-path>");
  }

  const payload = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const stats = payload.stats || {};
  const chartPaths = payload.chart_paths || {};
  const outputDir = payload.output_dir || process.cwd();

  const numbering = {
    config: [
      {
        reference: "bullet-ref",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "-",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  };

  const top10 = stats.top_10_customers || [];
  const topRows = [
    new TableRow({
      children: ["Customer ID", "Name", "Channel", "Revenue", "LTV", "Month"].map(
        (h) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
          })
      ),
    }),
    ...top10.map(
      (row) =>
        new TableRow({
          children: [
            row.customer_id,
            row.name,
            row.channel,
            currency(row.revenue),
            currency(row.ltv),
            row.month_year || "Unknown",
          ].map((v) => new TableCell({ children: [new Paragraph(String(v ?? ""))] })),
        })
    ),
  ];

  const monthly = stats.monthly_acquisitions || {};
  const highestMonth =
    Object.keys(monthly).length > 0
      ? Object.entries(monthly).sort((a, b) => Number(b[1]) - Number(a[1]))[0][0]
      : "N/A";

  const doc = new Document({
    numbering,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            size: { width: 12240, height: 15840 },
          },
        },
        children: [
          new Paragraph({ text: "CAV Analytics Report", heading: HeadingLevel.HEADING_1 }),
          new Paragraph(`Generated: ${new Date().toISOString().slice(0, 19).replace("T", " ")}`),
          new Paragraph(`Total records: ${stats.total_customers || 0}`),
          new Paragraph({ text: "", pageBreakBefore: true }),

          new Paragraph({ text: "KPI Dashboard", heading: HeadingLevel.HEADING_1 }),
          createKpiTable(stats),
          new Paragraph({ text: "", pageBreakBefore: true }),

          new Paragraph({ text: "Charts", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: "Revenue by Channel", heading: HeadingLevel.HEADING_2 }),
          imageParagraph(chartPaths.bar_revenue_by_channel),
          new Paragraph({ text: "Monthly Acquisitions", heading: HeadingLevel.HEADING_2 }),
          imageParagraph(chartPaths.line_monthly_acquisitions),
          new Paragraph({ text: "", pageBreakBefore: true }),

          new Paragraph({ text: "Channel Distribution", heading: HeadingLevel.HEADING_2 }),
          imageParagraph(chartPaths.pie_channel_distribution),
          new Paragraph({ text: "LTV by Channel", heading: HeadingLevel.HEADING_2 }),
          imageParagraph(chartPaths.bar_ltv_by_channel),
          new Paragraph({ text: "", pageBreakBefore: true }),

          new Paragraph({ text: "Top 10 Customers by LTV", heading: HeadingLevel.HEADING_1 }),
          new Table({ rows: topRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
          new Paragraph({ text: "", pageBreakBefore: true }),

          new Paragraph({ text: "Insights", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({
            text: `Top acquisition channel is ${stats.top_channel || "N/A"}.`,
            numbering: { reference: "bullet-ref", level: 0 },
          }),
          new Paragraph({
            text: `Average LTV is ${currency(stats.avg_ltv)}.`,
            numbering: { reference: "bullet-ref", level: 0 },
          }),
          new Paragraph({
            text: `Highest acquisition month was ${highestMonth}.`,
            numbering: { reference: "bullet-ref", level: 0 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(outputDir, "cav_report.docx");
  fs.writeFileSync(outputPath, buffer);
  process.stdout.write(outputPath);
}

main().catch((err) => {
  process.stderr.write(String(err && err.stack ? err.stack : err));
  process.exit(1);
});
