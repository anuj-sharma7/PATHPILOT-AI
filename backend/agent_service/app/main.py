"""
PathPilot AI - Python Research Service (FastAPI)
Exposes research endpoints backed by SerpApi Search Tools and Gemini.
"""

import logging
import os
from contextlib import asynccontextmanager
from typing import Dict, Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.models import SearchRequest, SearchResponse
from app.agents.research_orchestrator import ResearchOrchestrator

# Load environment variables from .env if present
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("pathpilot.api")

orchestrator: ResearchOrchestrator = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global orchestrator
    logger.info("Initializing PathPilot AI Research Service...")
    serpapi_key = os.environ.get("SERPAPI_API_KEY") or os.environ.get("SERPAPI_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")

    if serpapi_key:
        logger.info("SerpApi API Key detected.")
    else:
        logger.warning("SERPAPI_API_KEY not configured. Searches will operate in mock/demo fallback mode.")

    if gemini_key:
        logger.info("Gemini API Key detected.")
    else:
        logger.warning("GEMINI_API_KEY not configured. Analysis will use deterministic rule engine.")

    orchestrator = ResearchOrchestrator(
        serpapi_key=serpapi_key,
        gemini_key=gemini_key,
    )
    yield
    logger.info("Shutting down PathPilot AI Research Service.")


app = FastAPI(
    title="PathPilot AI - Research Service",
    description="Agentic opportunity discovery engine powered by official SerpApi Search Tools and Google Gemini.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration for Next.js frontend proxy and direct local calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
async def health_check() -> Dict[str, Any]:
    """Health check endpoint exposing readiness and configured providers."""
    serpapi_key = os.environ.get("SERPAPI_API_KEY") or os.environ.get("SERPAPI_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    return {
        "status": "healthy",
        "service": "PathPilot AI Research Agent",
        "version": "1.0.0",
        "serpapi_configured": bool(serpapi_key),
        "gemini_configured": bool(gemini_key),
        "tools": [
            "serpapi_search_tools.web_search",
            "serpapi_search_tools.news_search",
            "serpapi.google_jobs",
        ],
    }


@app.post("/api/research/search", response_model=SearchResponse, tags=["Research"])
async def search_opportunities(request: SearchRequest) -> SearchResponse:
    """
    Search and analyze opportunities for a student using SerpApi Search Tools
    and Gemini evidence grounding.
    """
    global orchestrator
    if orchestrator is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Research Orchestrator is not ready.",
        )

    try:
        response = await orchestrator.execute_research(request)
        return response
    except Exception as e:
        logger.exception("Research execution failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Research agent error: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
