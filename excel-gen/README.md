# CAV Report Generator

CLI tool to read a Customer Acquisition & Value Excel file, normalize data, compute analytics, and generate reports in `PDF`, `DOCX`, and `XLSX`.

## Requirements

- Python 3.10+
- Node.js 18+

## Project Files

- `main.py` - CLI entry point and orchestration
- `normalizer.py` - input normalization and column mapping
- `analyzer.py` - KPI computation
- `chart_builder.py` - chart PNG generation
- `pdf_generator.py` - PDF report output
- `docx_generator.js` - DOCX report output (Node `docx` package)
- `xlsx_generator.py` - XLSX report output

## Setup

From `excel-gen/`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm install
```

## Usage

```bash
python main.py --input data.xlsx --output ./reports --formats pdf docx xlsx
```

### CLI Arguments

- `--input` (required): path to source Excel file
- `--output` (optional): output folder (default: `./reports`)
- `--formats` (optional): one or more of `pdf`, `docx`, `xlsx` (default: all)

Examples:

```bash
python main.py --input data.xlsx
python main.py --input data.xlsx --formats pdf
python main.py --input data.xlsx --output ./my_reports --formats xlsx docx
```

## Column Mapping Supported

The normalizer auto-detects common variants (case-insensitive):

- Customer ID: `Customer ID`, `Cust ID`
- Name: `Name`, `Customer Name`, `Full Name`
- Acquisition Date: `Date`, `Acq Date`, `Acquisition Date`
- Channel: `Channel`, `Source`
- Revenue: `Revenue`, `Total Revenue`
- LTV: `LTV`, `Lifetime Value`, `Customer LTV`

## Date Parsing Behavior

Rows are kept even when dates are messy:

1. Standard pandas date parsing
2. Fallback parse with `dayfirst=True`
3. Explicit fallback formats:
   - `%d-%m-%Y`
   - `%m-%d-%Y`
   - `%Y/%m/%d`
   - `%d.%m.%Y`

If a date is still invalid, `month_year` is set to `Unknown`.

## Output Files

Generated in the output directory:

- `cav_report.pdf`
- `cav_report.docx`
- `cav_report.xlsx`

Temporary chart images are written to:

- `/tmp/cav_charts/`

## Error Handling

- Missing input file -> clear error message and non-zero exit
- Required columns unmapped -> list of missing canonical columns
- Single format failure -> warning logged; remaining formats still attempt
