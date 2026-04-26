from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import List

from analyzer import compute_kpis
from chart_builder import generate_charts
from normalizer import NormalizationError, normalize_excel
from pdf_generator import generate_pdf_report
from xlsx_generator import generate_xlsx_report


SUPPORTED_FORMATS = {"pdf", "docx", "xlsx"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate CAV analytics reports.")
    parser.add_argument("--input", required=True, help="Path to input CAV Excel file")
    parser.add_argument("--output", default="./reports", help="Output directory")
    parser.add_argument(
        "--formats",
        nargs="+",
        default=["pdf", "docx", "xlsx"],
        help="One or more formats: pdf docx xlsx",
    )
    return parser.parse_args()


def run_docx_generator(payload_path: Path) -> str:
    result = subprocess.run(
        ["node", "docx_generator.js", str(payload_path)],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        print(f"Error: input file not found -> {input_path}", file=sys.stderr)
        return 1

    formats: List[str] = [fmt.lower() for fmt in args.formats]
    invalid = sorted(set(formats) - SUPPORTED_FORMATS)
    if invalid:
        print(f"Error: unsupported format(s): {', '.join(invalid)}", file=sys.stderr)
        return 1

    try:
        df = normalize_excel(str(input_path))
    except NormalizationError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"Error while reading input file: {exc}", file=sys.stderr)
        return 1

    stats = compute_kpis(df)
    chart_paths = generate_charts(stats)

    payload_path = Path("/tmp/cav_data.json")
    payload_path.write_text(
        json.dumps(
            {
                "stats": stats,
                "chart_paths": chart_paths,
                "output_dir": str(output_dir.resolve()),
            },
            default=str,
            indent=2,
        ),
        encoding="utf-8",
    )

    results = []
    for fmt in formats:
        try:
            if fmt == "pdf":
                path = generate_pdf_report(stats, chart_paths, str(output_dir))
                results.append(("PDF", path))
            elif fmt == "xlsx":
                path = generate_xlsx_report(df, stats, str(output_dir))
                results.append(("XLSX", path))
            elif fmt == "docx":
                path = run_docx_generator(payload_path)
                results.append(("DOCX", path))
        except Exception as exc:
            print(f"Warning: failed to generate {fmt.upper()} -> {exc}", file=sys.stderr)

    if not results:
        print("No reports were generated.", file=sys.stderr)
        return 1

    for label, path in results:
        print(f"SUCCESS {label} saved to {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
