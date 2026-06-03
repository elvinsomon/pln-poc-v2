"""Constantes compartidas: clases, preprocesado por defecto y mapa de prioridad.

`DEFAULT_PREPROCESS` reproduce los valores de `PoC-C2/configs/{base,data}.yaml`
con los que se entrenaron los modelos. El notebook lo usa para construir los
splits y lo estampa en el `meta.json` del artefacto; el backend, en inferencia,
lee la copia del `meta.json` (no estas constantes) para no depender de que
ambos lados queden sincronizados a mano.
"""
from __future__ import annotations

SEED = 42

CLASSES = ["bug", "feature", "question"]

DEFAULT_PREPROCESS = {
    "max_text_chars": 5000,
    "anonymize": {"emails": True, "urls": True, "handles": True},
    "clean": {
        "strip_code_blocks": True,
        "strip_markdown": True,
        "normalize_whitespace": True,
    },
    "build_text": "title_space_body_strip",
}

# Mapa categoría -> prioridad. Fuente de verdad; `backend/services/priority.py`
# la importa para derivar prioridad y rango de orden.
CATEGORY_TO_PRIORITY = {
    "bug": "Alta",
    "question": "Media",
    "feature": "Baja",
}

# Rango numérico para ORDER BY (menor = más urgente, aparece primero).
PRIORITY_RANK = {"Alta": 0, "Media": 1, "Baja": 2}
