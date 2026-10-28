from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from app.core.config import settings
from app.database.session import init_db, close_db
from app.api.v1.api import api_router


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=settings.app_name,
        version=settings.app_version,
        description="""
# TraceX - AI-Powered Fraud Investigation Platform

## Overview
TraceX is a comprehensive fraud investigation and digital evidence reconstruction platform designed for financial institutions, law enforcement, and compliance teams.

## Features
- **Case Management**: Full lifecycle case management with assignment, status tracking, and collaboration
- **Evidence Vault**: Secure evidence storage with chain of custody tracking and integrity verification
- **Entity Resolution**: Advanced entity linking and resolution with risk scoring
- **Transaction Analysis**: Money flow analysis, pattern detection, and anomaly identification
- **Timeline Reconstruction**: Event correlation, impossible travel detection, and suspicious pattern analysis
- **Risk Assessment**: Multi-factor risk scoring with configurable signals and hypotheses
- **Network Graph**: Relationship mapping, pathfinding, community detection, and centrality analysis
- **Authentication**: JWT-based auth with MFA (TOTP), password reset, and role-based access control

## Authentication
All API endpoints (except `/health`, `/ready`, `/auth/*`) require a valid JWT Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Rate Limiting
API requests are rate-limited to 100 requests per minute per IP.

## Error Responses
All errors follow a standard format:
```json
{
  "detail": "Error description",
  "code": "ERROR_CODE",
  "status_code": 400
}
```
        """,
        routes=app.routes,
        tags=[
            {"name": "Authentication", "description": "User registration, login, MFA, password reset"},
            {"name": "Cases", "description": "Case management and trace board"},
            {"name": "Evidence", "description": "Evidence vault, upload, chain of custody"},
            {"name": "Entities", "description": "Entity management, resolution, relationships"},
            {"name": "Transactions", "description": "Transaction analysis and money flow"},
            {"name": "Timeline", "description": "Event timeline, correlations, analysis"},
            {"name": "Risk", "description": "Risk signals, scoring, assessments, hypotheses"},
            {"name": "Graph", "description": "Network graph, pathfinding, communities, centrality"},
            {"name": "Health", "description": "Service health and readiness checks"},
        ],
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method.setdefault("security", [{"BearerAuth": []}])
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-Powered Fraud Investigation & Digital Evidence Reconstruction Platform",
    on_startup=[init_db],
    on_shutdown=[close_db],
    docs_url=None,
    redoc_url=None,
    openapi_url="/api/v1/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

app.openapi = custom_openapi


@app.get("/docs", include_in_schema=False)
async def swagger_ui():
    return get_swagger_ui_html(
        openapi_url="/api/v1/openapi.json",
        title=f"{settings.app_name} - API Documentation",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )


@app.get("/redoc", include_in_schema=False)
async def redoc():
    return get_redoc_html(
        openapi_url="/api/v1/openapi.json",
        title=f"{settings.app_name} - API Documentation",
        redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js",
    )


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint for load balancers"""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
    }


@app.get("/ready", tags=["Health"])
def readiness_check():
    """Readiness check endpoint for Kubernetes"""
    return {
        "status": "ready",
        "service": settings.app_name,
        "version": settings.app_version,
    }