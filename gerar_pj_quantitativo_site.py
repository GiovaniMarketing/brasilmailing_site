from __future__ import annotations

import json
import re
from pathlib import Path

import pyodbc


CONNECTION = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=BRASILMAILING;"
    "DATABASE=BASE_RECEITA_FEDERAL;"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"
)

OUTPUT = Path(__file__).resolve().parent / "data" / "pj_quantitativo.json"
VALID_UFS = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
    "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
}


def only_digits(value: str | None) -> str:
    return re.sub(r"\D+", "", value or "")


def main() -> None:
    sql = """
    SET NOCOUNT ON;

    SELECT
        uf = UPPER(LTRIM(RTRIM(ISNULL(uf, '')))),
        cidade = UPPER(LTRIM(RTRIM(ISNULL(cidade, '')))),
        cnae_classe = LEFT(dbo_digits, 2),
        total = COUNT_BIG(*),
        com_fixo = SUM(CASE WHEN COALESCE(NULLIF(FIXO_1,''), NULLIF(FIXO_2,''), NULLIF(FIXO_3,''), NULLIF(FIXO_4,''), NULLIF(FIXO_5,'')) IS NOT NULL THEN 1 ELSE 0 END),
        com_celular = SUM(CASE WHEN COALESCE(NULLIF(CELULAR_1,''), NULLIF(CELULAR_2,''), NULLIF(CELULAR_3,''), NULLIF(CELULAR_4,''), NULLIF(CELULAR_5,'')) IS NOT NULL THEN 1 ELSE 0 END),
        com_ambos = SUM(CASE WHEN
            COALESCE(NULLIF(FIXO_1,''), NULLIF(FIXO_2,''), NULLIF(FIXO_3,''), NULLIF(FIXO_4,''), NULLIF(FIXO_5,'')) IS NOT NULL
            AND COALESCE(NULLIF(CELULAR_1,''), NULLIF(CELULAR_2,''), NULLIF(CELULAR_3,''), NULLIF(CELULAR_4,''), NULLIF(CELULAR_5,'')) IS NOT NULL
            THEN 1 ELSE 0 END)
    FROM
    (
        SELECT
            uf,
            cidade,
            cnae_principal,
            dbo_digits = LEFT(REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(cnae_principal,''),'.',''),'-',''),'/',''),' ',''), 2),
            FIXO_1, FIXO_2, FIXO_3, FIXO_4, FIXO_5,
            CELULAR_1, CELULAR_2, CELULAR_3, CELULAR_4, CELULAR_5
        FROM dbo.tb_marketing_consolidado_FINAL WITH (NOLOCK)
    ) AS base
    WHERE uf <> ''
      AND cidade <> ''
    GROUP BY
        UPPER(LTRIM(RTRIM(ISNULL(uf, '')))),
        UPPER(LTRIM(RTRIM(ISNULL(cidade, '')))),
        LEFT(dbo_digits, 2)
    HAVING COUNT_BIG(*) > 0
    ORDER BY uf, cidade, cnae_classe;
    """

    rows = []
    cnae_classes = set()
    cities = {}
    totals = {"total": 0, "fixos": 0, "celulares": 0, "ambos": 0}

    with pyodbc.connect(CONNECTION) as conn:
        cursor = conn.cursor()
        for uf, cidade, cnae, total, fixos, celulares, ambos in cursor.execute(sql):
            cnae = only_digits(cnae)[:2] or "NAO INFORMADO"
            total = int(total or 0)
            fixos = int(fixos or 0)
            celulares = int(celulares or 0)
            ambos = int(ambos or 0)
            if uf not in VALID_UFS:
                continue
            row = {
                "uf": uf,
                "cidade": cidade,
                "cnae": cnae,
                "total": total,
                "fixos": fixos,
                "celulares": celulares,
                "ambos": ambos,
            }
            rows.append(row)
            cnae_classes.add(cnae)
            cities.setdefault(uf, set()).add(cidade)
            totals["total"] += total
            totals["fixos"] += fixos
            totals["celulares"] += celulares
            totals["ambos"] += ambos

    payload = {
        "updatedAt": "2026-09-04",
        "grain": "uf_cidade_cnae_classe",
        "totals": totals,
        "cnaeClasses": sorted(cnae_classes),
        "citiesByUf": {uf: sorted(values) for uf, values in sorted(cities.items())},
        "rows": rows,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Arquivo gerado: {OUTPUT}")
    print(f"Linhas agregadas: {len(rows):,}")
    print(f"Tamanho MB: {OUTPUT.stat().st_size / 1024 / 1024:.2f}")


if __name__ == "__main__":
    main()
