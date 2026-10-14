"""Motor estadístico portable: Python estándar, sin claves ni dependencias externas."""
import json
from statistics import mean, median
from math import isfinite


def summarize(amounts: list[float]) -> dict:
    values = [float(x) for x in amounts]
    if not values:
        raise ValueError('Se requiere al menos una observación.')
    if len(values) > 10000 or not all(isfinite(x) and x >= 0 for x in values):
        raise ValueError('La muestra debe contener entre 1 y 10 000 importes válidos.')
    return {
        'n': len(values),
        'total': round(sum(values), 2),
        'mean': round(mean(values), 4),
        'median': round(median(values), 4),
        'minimum': min(values),
        'maximum': max(values),
    }


def bayes(prior: float, likelihood: float, false_positive: float) -> dict:
    values = (prior, likelihood, false_positive)
    if not all(isfinite(x) and 0 <= x <= 1 for x in values):
        raise ValueError('Las probabilidades deben pertenecer al intervalo [0, 1].')
    evidence = prior * likelihood + (1-prior)*false_positive
    if evidence <= 0:
        raise ValueError('La probabilidad de evidencia debe ser mayor que cero.')
    return {'evidence': evidence, 'posterior': prior*likelihood/evidence}


def salesia_summary(json_input: str) -> str:
    """Puente JSON para Pyodide en el navegador (sin servidor)."""
    return json.dumps(summarize(json.loads(json_input)))
