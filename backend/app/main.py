from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.statistics import summarize, bayes

app = FastAPI(title="SalesIA Analytics Engine")

# Configuración de CORS para permitir tu frontend de Render y desarrollo local
origins = [
    "https://erp-salesia-enterprise.onrender.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # O puedes usar ["*"] para permitir todos los orígenes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "service": "SalesIA Analytics Engine"}

@app.post("/api/statistics/summarize")
def api_summarize(payload: dict):
    data = payload.get("data", [])
    return summarize(data)

@app.post("/api/statistics/bayes")
def api_bayes(payload: dict):
    prior = payload.get("prior", {})
    observations = payload.get("observations", [])
    return bayes(prior, observations)