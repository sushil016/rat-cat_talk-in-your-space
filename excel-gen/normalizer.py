from __future__ import annotations

from typing import Dict, List

import pandas as pd


class NormalizationError(Exception):
    """Raised when required columns cannot be mapped."""


CANONICAL_COLUMNS: Dict[str, List[str]] = {
    "customer_id": ["customer id", "cust id", "id"],
    "name": ["name", "customer name", "full name"],
    "acquisition_date": ["acquisition date", "acq date", "date"],
    "channel": ["channel", "source"],
    "revenue": ["revenue", "total revenue"],
    "ltv": ["ltv", "lifetime value", "customer ltv"],
}


def _normalize_column_name(name: str) -> str:
    return " ".join(str(name).strip().lower().replace("_", " ").split())


def _map_columns(columns: List[str]) -> Dict[str, str]:
    normalized_source = {_normalize_column_name(col): col for col in columns}
    mapped: Dict[str, str] = {}
    missing: List[str] = []

    for canonical, variants in CANONICAL_COLUMNS.items():
        match = next((v for v in variants if v in normalized_source), None)
        if match is None:
            missing.append(canonical)
        else:
            mapped[canonical] = normalized_source[match]

    if missing:
        raise NormalizationError(
            "Required columns could not be mapped: " + ", ".join(missing)
        )

    return mapped


def _parse_acquisition_date_with_fallback(series: pd.Series) -> pd.Series:
    # Pass 1: pandas default flexible parser.
    parsed = pd.to_datetime(series, errors="coerce")
    if parsed.notna().all():
        return parsed

    # Pass 2: day-first fallback for formats like 31/01/2024.
    remaining_mask = parsed.isna()
    parsed_day_first = pd.to_datetime(
        series[remaining_mask], errors="coerce", dayfirst=True
    )
    parsed.loc[remaining_mask] = parsed_day_first

    # Pass 3: common explicit formats.
    remaining_mask = parsed.isna()
    if remaining_mask.any():
        explicit_formats = ["%d-%m-%Y", "%m-%d-%Y", "%Y/%m/%d", "%d.%m.%Y"]
        for fmt in explicit_formats:
            if not remaining_mask.any():
                break
            parsed_fmt = pd.to_datetime(
                series[remaining_mask], format=fmt, errors="coerce"
            )
            fill_mask = parsed_fmt.notna()
            parsed.loc[remaining_mask[remaining_mask].index[fill_mask]] = parsed_fmt[
                fill_mask
            ]
            remaining_mask = parsed.isna()

    return parsed


def normalize_excel(input_path: str) -> pd.DataFrame:
    df = pd.read_excel(input_path)
    if df.empty:
        return pd.DataFrame(
            columns=[
                "customer_id",
                "name",
                "acquisition_date",
                "channel",
                "revenue",
                "ltv",
                "month_year",
            ]
        )

    column_mapping = _map_columns(df.columns.tolist())
    selected = df.rename(columns={v: k for k, v in column_mapping.items()})[
        list(column_mapping.keys())
    ].copy()

    selected = selected.drop_duplicates()
    selected["customer_id"] = selected["customer_id"].astype(str).str.strip()
    selected["name"] = selected["name"].fillna("").astype(str).str.strip()
    selected["channel"] = (
        selected["channel"].fillna("Unknown").astype(str).str.strip().replace("", "Unknown")
    )

    selected["revenue"] = pd.to_numeric(selected["revenue"], errors="coerce").fillna(0.0)
    selected["ltv"] = pd.to_numeric(selected["ltv"], errors="coerce").fillna(0.0)

    selected["acquisition_date"] = _parse_acquisition_date_with_fallback(
        selected["acquisition_date"]
    )
    selected["month_year"] = selected["acquisition_date"].dt.strftime("%b %Y")
    selected.loc[selected["month_year"].isna(), "month_year"] = "Unknown"

    return selected
