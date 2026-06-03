"""Cadena de preprocesado — fuente única para entrenamiento e inferencia.

Vendorizado verbatim desde PoC-C2 (`src/data/anonymize.py`, `src/data/clean.py`,
`src/data/splits.py::_build_text`). El backend y el notebook DEBEN usar estas
mismas funciones: el modelo se entrenó sobre el texto que producen, así que
cualquier divergencia degrada la precisión en producción.

`build_inference_text` replica `splits.py::preprocess` para un único (title, body),
tomando la configuración del `meta.json` del artefacto (no de constantes
hardcodeadas) para garantizar que coincide con cómo se entrenó.
"""
from __future__ import annotations

import re
from typing import Any


# --- anonimización (C0 / RGPD) -------------------------------------------------
_RE_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_RE_URL = re.compile(r"https?://\S+|www\.\S+")
_RE_HANDLE = re.compile(r"(?<!\w)@[A-Za-z0-9_-]{2,}")


def anonymize(text: str, *, emails: bool = True, urls: bool = True, handles: bool = True) -> str:
    if not isinstance(text, str):
        return ""
    if urls:
        text = _RE_URL.sub(" <URL> ", text)
    if emails:
        text = _RE_EMAIL.sub(" <EMAIL> ", text)
    if handles:
        text = _RE_HANDLE.sub(" <USER> ", text)
    return text


# --- limpieza textual ----------------------------------------------------------
_RE_CODE_FENCE = re.compile(r"```.*?```", re.DOTALL)
_RE_INLINE_CODE = re.compile(r"`[^`\n]+`")
_RE_MD_LINK = re.compile(r"\[([^\]]+)\]\([^)]+\)")
_RE_MD_IMG = re.compile(r"!\[[^\]]*\]\([^)]+\)")
_RE_HTML_TAG = re.compile(r"<[^>]+>")
_RE_MULTISPACE = re.compile(r"\s+")


def strip_code_blocks(text: str) -> str:
    return _RE_CODE_FENCE.sub(" <CODE> ", _RE_INLINE_CODE.sub(" <CODE> ", text))


def strip_markdown(text: str) -> str:
    text = _RE_MD_IMG.sub(" ", text)
    text = _RE_MD_LINK.sub(r"\1", text)
    return _RE_HTML_TAG.sub(" ", text)


def normalize_whitespace(text: str) -> str:
    return _RE_MULTISPACE.sub(" ", text).strip()


def truncate(text: str, max_chars: int) -> str:
    return text[:max_chars] if len(text) > max_chars else text


def clean_text(text: str, *, max_chars: int | None = None,
               do_code: bool = True, do_md: bool = True, do_ws: bool = True) -> str:
    if not isinstance(text, str):
        return ""
    if do_code:
        text = strip_code_blocks(text)
    if do_md:
        text = strip_markdown(text)
    if do_ws:
        text = normalize_whitespace(text)
    if max_chars is not None:
        text = truncate(text, max_chars)
    return text


# --- combinación título+cuerpo -------------------------------------------------
def build_text(title: str | float, body: str | float) -> str:
    """Combina título y cuerpo (verbatim de splits.py::_build_text)."""
    t = title if isinstance(title, str) else ""
    b = body if isinstance(body, str) else ""
    return f"{t} {b}".strip()


# --- cadena completa para un único ticket (inferencia) -------------------------
def build_inference_text(title: str | float, body: str | float, pre: dict[str, Any]) -> str:
    """Replica `splits.py::preprocess` para un (title, body).

    `pre` es el bloque `preprocessing` del meta.json del artefacto:
        {"max_text_chars": int,
         "anonymize": {"emails","urls","handles"},
         "clean": {"strip_code_blocks","strip_markdown","normalize_whitespace"}}
    """
    a = pre["anonymize"]
    c = pre["clean"]
    text = build_text(title, body)
    text = anonymize(text, emails=a["emails"], urls=a["urls"], handles=a["handles"])
    text = clean_text(
        text,
        max_chars=pre.get("max_text_chars"),
        do_code=c["strip_code_blocks"],
        do_md=c["strip_markdown"],
        do_ws=c["normalize_whitespace"],
    )
    return text
