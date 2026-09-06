import json
import re
from pathlib import Path

import pdfplumber


PDF_PATH = Path(r"C:\Users\Giovani\Desktop\ARQ_PDF\CNAE 2.1 ESTRUTURA DETALHADA.pdf")
OUTPUT_PATH = Path(r"E:\brasilmailing_site\data\cnae.json")


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def extract_cnaes() -> list[dict[str, str]]:
    items: dict[str, list[str]] = {}
    with pdfplumber.open(PDF_PATH) as pdf:
        for page in pdf.pages:
            words = page.extract_words(use_text_flow=False, keep_blank_chars=False)
            lines: dict[int, list[dict]] = {}
            for word in words:
                top = int(round(word["top"]))
                lines.setdefault(top, []).append(word)

            sorted_tops = sorted(lines)
            active_code = None
            pending_description: list[str] = []
            for index, top in enumerate(sorted_tops):
                line_words = lines[top]
                line_words.sort(key=lambda word: word["x0"])
                text = normalize_space(" ".join(word["text"] for word in line_words))
                code_word = next(
                    (word for word in line_words if re.fullmatch(r"\d{4}-\d/\d{2}", word["text"])),
                    None,
                )
                has_left_code = any(word["x0"] < 257 and re.search(r"\d", word["text"]) for word in line_words)
                next_words = lines[sorted_tops[index + 1]] if index + 1 < len(sorted_tops) else []
                next_has_class_code = any(
                    word["x0"] < 205 and re.fullmatch(r"\d{2}(?:\.\d{1,2})?(?:-\d)?", word["text"])
                    for word in next_words
                )
                next_has_subclass_code = any(
                    re.fullmatch(r"\d{4}-\d/\d{2}", word["text"])
                    for word in next_words
                )

                if code_word:
                    active_code = code_word["text"]
                    description = normalize_space(
                        " ".join(word["text"] for word in line_words if word["x0"] >= 257)
                    )
                    if pending_description and not description:
                        description = normalize_space(" ".join(pending_description))
                    pending_description = []
                    if description:
                        items.setdefault(active_code, []).append(description)
                    continue

                if has_left_code:
                    active_code = None
                    pending_description = []
                    continue

                if line_words and min(word["x0"] for word in line_words) >= 257:
                    if not re.search(r"continua|c[o�]digo|denomina", text, re.I):
                        if next_has_subclass_code:
                            pending_description = [text]
                            continue
                        if active_code and not next_has_class_code:
                            items.setdefault(active_code, []).append(text)

    return [
        {
            "codigo": codigo,
            "classe": codigo[:2],
            "descricao": normalize_space(" ".join(parts)),
            "busca": normalize_space(f"{codigo} {' '.join(parts)}"),
        }
        for codigo, parts in sorted(items.items())
        if len(normalize_space(" ".join(parts))) >= 3
    ]


def main() -> None:
    rows = extract_cnaes()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(
            {
                "updatedAt": "2026-09-04",
                "total": len(rows),
                "rows": rows,
            },
            ensure_ascii=False,
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    print(f"{len(rows)} CNAEs gravados em {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
