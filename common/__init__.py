"""Paquete compartido entre el notebook de entrenamiento y el backend.

Centraliza la cadena de preprocesado para que inferencia y entrenamiento usen
EXACTAMENTE el mismo código (evita el drift que degradaría las predicciones).
"""
