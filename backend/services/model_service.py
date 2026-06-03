"""Servicio de modelo: carga el artefacto activo y predice.

Lee `artifacts/active.json` -> carpeta del artefacto -> `meta.json` y ramifica
por `meta["type"]`:
  - "sklearn": Pipeline TF-IDF+LinearSVC (joblib). Confianza = softmax sobre
    decision_function. Solo necesita scikit-learn + joblib (ligero).
  - "bert": DistilBERT (HuggingFace). Confianza = softmax sobre logits. Importa
    torch/transformers de forma PEREZOSA (solo si gana BERT).

El preprocesado se aplica con `common.preprocessing.build_inference_text` usando
la config que viaja en el `meta.json` -> coincide exactamente con el entrenamiento.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np

from common.preprocessing import build_inference_text


@dataclass
class PredictResult:
    label: str
    confidence: float
    probabilities: dict[str, float]   # {clase: prob}, en orden de meta["classes"]


def _softmax(x: np.ndarray) -> np.ndarray:
    x = x - x.max(axis=-1, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=-1, keepdims=True)


class ModelService:
    def __init__(self, artifacts_dir: str | Path):
        self.artifacts_dir = Path(artifacts_dir)
        self.meta: dict[str, Any] = {}
        self.type: str = ""
        self.classes: list[str] = []
        self.version: str = ""
        self._pre: dict[str, Any] = {}
        # sklearn
        self._pipeline = None
        self._svm_classes: list[str] = []
        # bert
        self._tokenizer = None
        self._model = None
        self._device: str | None = None
        self._max_length: int = 256
        self._id2label: dict[int, str] = {}

    # ---- ciclo de vida -------------------------------------------------------
    def load(self) -> None:
        active = json.loads((self.artifacts_dir / "active.json").read_text(encoding="utf-8"))["active"]
        adir = self.artifacts_dir / active
        self.meta = json.loads((adir / "meta.json").read_text(encoding="utf-8"))
        self.version = active
        self.type = self.meta["type"]
        self.classes = self.meta["classes"]
        self._pre = self.meta["preprocessing"]
        if self.type == "sklearn":
            self._load_sklearn(adir)
        elif self.type == "bert":
            self._load_bert(adir)
        else:
            raise ValueError(f"Tipo de artefacto desconocido: {self.type!r}")

    def _load_sklearn(self, adir: Path) -> None:
        import joblib  # ligero
        self._pipeline = joblib.load(adir / self.meta["files"]["model"])
        self._svm_classes = list(self._pipeline.named_steps["svm"].classes_)

    def _load_bert(self, adir: Path) -> None:
        import torch  # perezoso: solo si gana BERT
        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        lm = json.loads((adir / self.meta["files"]["label_map"]).read_text(encoding="utf-8"))
        self._id2label = {int(i): c for c, i in lm["label2id"].items()}
        self._max_length = self.meta.get("bert", {}).get("max_length", 256)
        if torch.cuda.is_available():
            self._device = "cuda"
        elif getattr(torch.backends, "mps", None) is not None and torch.backends.mps.is_available():
            self._device = "mps"
        else:
            self._device = "cpu"
        self._tokenizer = AutoTokenizer.from_pretrained(adir)
        self._model = AutoModelForSequenceClassification.from_pretrained(adir).to(self._device).eval()

    # ---- preprocesado (debe igualar al entrenamiento) ------------------------
    def preprocess(self, title: str, body: str) -> str:
        return build_inference_text(title, body, self._pre)

    # ---- inferencia ----------------------------------------------------------
    def predict(self, title: str, body: str) -> PredictResult:
        text = self.preprocess(title, body)
        if self.type == "sklearn":
            return self._predict_sklearn(text)
        return self._predict_bert(text)

    def _predict_sklearn(self, text: str) -> PredictResult:
        scores = np.asarray(self._pipeline.decision_function([text])[0], dtype=float)  # (n_clases,) OvR
        probs = _softmax(scores)
        # decision_function sigue el orden de svm.classes_, no el de meta["classes"].
        prob_map = {cls: float(p) for cls, p in zip(self._svm_classes, probs)}
        return self._result(prob_map)

    def _predict_bert(self, text: str) -> PredictResult:
        import torch
        enc = self._tokenizer(
            [text], truncation=True, padding=True,
            max_length=self._max_length, return_tensors="pt",
        ).to(self._device)
        with torch.no_grad():
            logits = self._model(**enc).logits[0].cpu().numpy()
        probs = _softmax(np.asarray(logits, dtype=float))
        prob_map = {self._id2label[i]: float(p) for i, p in enumerate(probs)}
        return self._result(prob_map)

    def _result(self, prob_map: dict[str, float]) -> PredictResult:
        # Reordena a meta["classes"] -> salida JSON estable independientemente del modelo.
        ordered = {c: prob_map[c] for c in self.classes}
        label = max(ordered, key=ordered.get)
        return PredictResult(label=label, confidence=ordered[label], probabilities=ordered)


# Singleton inicializado en el startup de FastAPI.
model_service: ModelService | None = None


def get_model_service() -> ModelService:
    if model_service is None:
        raise RuntimeError("ModelService no inicializado (¿corrió el startup?).")
    return model_service
