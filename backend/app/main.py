"""FastAPI optativa. NO se ejecuta en Render Static Site.

Desplegar por separado solo si el docente requiere un servidor Python real;
se entrega deshabilitada para datos empresariales hasta añadir JWT/RLS al backend.
No incluir claves privadas de Supabase en esta API.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from .statistics import summarize, bayes

app = FastAPI(title='SalesIA · Motor académico Python', version='1.0.0')

class StatsInput(BaseModel):
    amounts: list[float] = Field(min_length=1, max_length=10000)

class BayesInput(BaseModel):
    prior: float = Field(ge=0, le=1)
    likelihood: float = Field(ge=0, le=1)
    false_positive: float = Field(ge=0, le=1)

@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'motor-estadistico'}

@app.post('/statistics/summary')
def summary(payload: StatsInput):
    try:
        return summarize(payload.amounts)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

@app.post('/probability/bayes')
def probability(payload: BayesInput):
    try:
        return bayes(payload.prior, payload.likelihood, payload.false_positive)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
