from fastapi import APIRouter
from app.auth import auth_router
from app.api.v1.cases import cases_router
from app.api.v1.evidence import evidence_router
from app.api.v1.entities import entities_router
from app.api.v1.transactions import transactions_router
from app.api.v1.timeline import timeline_router
from app.api.v1.risk import risk_router
from app.api.v1.graph import graph_router
from app.api.v1.users import router as users_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(cases_router, prefix="/cases", tags=["cases"])
api_router.include_router(evidence_router, prefix="/evidence", tags=["evidence"])
api_router.include_router(entities_router, prefix="/entities", tags=["entities"])
api_router.include_router(transactions_router, prefix="/transactions", tags=["transactions"])
api_router.include_router(timeline_router, prefix="/timeline", tags=["timeline"])
api_router.include_router(risk_router, prefix="/risk", tags=["risk"])
api_router.include_router(graph_router, prefix="/graph", tags=["graph"])

# Placeholder for future routers
# from app.api.v1 import ai, reports

@api_router.get("/")
async def api_root():
    return {
        "message": "TRACE X API v1",
        "version": "0.1.0",
        "endpoints": {
            "auth": "/auth",
            "users": "/users",
            "cases": "/cases",
            "evidence": "/evidence",
            "entities": "/entities",
            "transactions": "/transactions",
            "timeline": "/timeline",
            "risk": "/risk",
            "graph": "/graph",
            "ai": "/ai",
            "reports": "/reports",
        }
    }