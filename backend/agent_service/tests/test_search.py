"""
Unit and integration tests for PathPilot AI Python Research Service
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from app.models import (
    StudentProfile,
    Opportunity,
    OpportunityCategory,
    SearchRequest,
    SearchResponse,
)
from app.serpapi.web_search import WebSearchClient
from app.serpapi.news_search import NewsSearchClient
from app.serpapi.google_jobs import GoogleJobsClient
from app.ai.gemini_planner import GeminiResearchPlanner
from app.agents.research_orchestrator import ResearchOrchestrator
from app.main import app


def test_models_validation():
    profile = StudentProfile(
        degree="B.Tech",
        field_of_study="Computer Science",
        year_of_study=3,
        skills=["Python", "FastAPI"],
        interests=["AI", "Backend"],
        location_preference="Bengaluru",
    )
    assert profile.degree == "B.Tech"
    assert len(profile.skills) == 2

    req = SearchRequest(
        query="AI Engineer Intern",
        profile=profile,
        location="India",
    )
    assert req.query == "AI Engineer Intern"


@pytest.mark.asyncio
async def test_gemini_planner_heuristics():
    planner = GeminiResearchPlanner(api_key=None)
    profile = StudentProfile(
        degree="B.Tech",
        field_of_study="Computer Science",
        year_of_study=3,
        skills=["Python", "React"],
    )

    plan = await planner.plan_search_queries("Machine Learning", profile)
    assert "web_queries" in plan
    assert "news_queries" in plan
    assert "job_queries" in plan
    assert len(plan["web_queries"]) >= 1

    opp = Opportunity(
        id="opp_1",
        title="Python ML Research Intern",
        organization="AI Lab",
        category="research",
        location="Remote",
        source_url="https://example.com/ml-intern",
        snippet="Seeking students with Python and React experience in Computer Science.",
    )

    fit = await planner.analyze_opportunity_fit(opp, profile)
    assert fit["match_score"] >= 70
    assert len(fit["match_reasons"]) >= 1
    assert len(fit["verified_requirements"]) >= 1


@pytest.mark.asyncio
async def test_web_search_wrapper():
    client = WebSearchClient(api_key="mock_key")
    client._search_fn = MagicMock(return_value='{"organic_results": [{"title": "Google Fellowship", "link": "https://research.google/fellowship", "snippet": "Fellowship for students", "source": "Google"}]}')

    res = await client.search("Google Fellowship")
    assert "organic_results" in res
    assert res["organic_results"][0]["title"] == "Google Fellowship"


@pytest.mark.asyncio
async def test_news_search_wrapper():
    client = NewsSearchClient(api_key="mock_key")
    client._search_fn = MagicMock(return_value={"news_results": [{"title": "Hackathon 2026 Announced", "link": "https://news.example.com/hack", "snippet": "Hackathon prizes announced", "source": "Tech News"}]})

    res = await client.search("Hackathon 2026")
    assert "news_results" in res
    assert res["news_results"][0]["title"] == "Hackathon 2026 Announced"


@pytest.mark.asyncio
async def test_google_jobs_client():
    client = GoogleJobsClient(api_key="mock_key")
    mock_payload = {
        "jobs_results": [
            {
                "title": "Software Engineer Intern",
                "company_name": "Tech Corp",
                "location": "Bengaluru",
                "description": "Summer internship for CS students",
                "share_link": "https://jobs.example.com/123",
            }
        ]
    }

    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.json.return_value = mock_payload
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        res = await client.search("Software Engineer Intern", location="Bengaluru")
        assert "jobs_results" in res
        assert res["jobs_results"][0]["company_name"] == "Tech Corp"


@pytest.mark.asyncio
async def test_research_orchestrator_execution():
    orchestrator = ResearchOrchestrator(serpapi_key="test_key", gemini_key=None)

    # Mock web, news, and jobs
    orchestrator.web_client.search = AsyncMock(return_value={
        "organic_results": [
            {
                "title": "National Merit Scholarship 2026",
                "link": "https://scholarships.org/merit",
                "snippet": "Scholarships for undergraduate students",
                "source": "Scholarship Board",
            }
        ]
    })
    orchestrator.news_client.search = AsyncMock(return_value={
        "news_results": [
            {
                "title": "Smart India Hackathon 2026 Registrations Open",
                "link": "https://hack.org/sih",
                "snippet": "National level hackathon for college students",
                "source": "Education Ministry",
                "date": "2026-03-01",
            }
        ]
    })
    orchestrator.jobs_client.search = AsyncMock(return_value={
        "jobs_results": [
            {
                "title": "Data Science Intern",
                "company_name": "Analytics Co",
                "location": "Hyderabad",
                "description": "Python, SQL and Machine Learning required",
                "share_link": "https://jobs.org/ds",
            }
        ]
    })

    req = SearchRequest(
        query="Data Science",
        profile=StudentProfile(
            degree="B.Tech",
            field_of_study="Data Science",
            skills=["Python", "SQL"],
        ),
    )

    response = await orchestrator.execute_research(req)
    assert isinstance(response, SearchResponse)
    assert response.total_found >= 3
    assert response.is_live is True
    assert any(o.category == "scholarship" for o in response.opportunities)
    assert any(o.category == "hackathon" for o in response.opportunities)
    assert any(o.category == "internship" for o in response.opportunities)

    # Verify evidence panel grounding
    for opp in response.opportunities:
        assert opp.evidence is not None
        assert opp.match_score >= 50
        assert len(opp.evidence.match_reasons) > 0


def test_health_endpoint():
    with TestClient(app) as client:
        res = client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert "serpapi_search_tools.web_search" in data["tools"]
