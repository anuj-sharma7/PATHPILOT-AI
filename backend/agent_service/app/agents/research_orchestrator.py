"""
PathPilot AI - Multi-Engine Research Orchestrator
Coordinates SerpApi Search Tools (web_search, news_search) and direct Google Jobs API,
followed by Gemini evidence grounding and explainable profile matching.
"""

import asyncio
import hashlib
import logging
import time
from typing import Any, Dict, List, Optional, Set

from app.models import (
    Opportunity,
    OpportunityCategory,
    OpportunityEvidence,
    SearchRequest,
    SearchResponse,
    StudentProfile,
)
from app.serpapi.web_search import WebSearchClient
from app.serpapi.news_search import NewsSearchClient
from app.serpapi.google_jobs import GoogleJobsClient
from app.ai.gemini_planner import GeminiResearchPlanner

logger = logging.getLogger("pathpilot.agents.orchestrator")


def _generate_id(title: str, organization: str, link: str) -> str:
    seed = f"{title.strip().lower()}:{organization.strip().lower()}:{link.strip().lower()}"
    return f"opp_{hashlib.md5(seed.encode('utf-8')).hexdigest()[:12]}"


def _infer_category(title: str, snippet: str, default: OpportunityCategory = "internship") -> OpportunityCategory:
    text = f"{title} {snippet}".lower()
    if any(k in text for k in ["scholarship", "bursary", "grant", "financial aid"]):
        return "scholarship"
    if any(k in text for k in ["hackathon", "coding challenge", "ideathon", "datathon"]):
        return "hackathon"
    if any(k in text for k in ["fellowship", "fellow"]):
        return "fellowship"
    if any(k in text for k in ["research", "lab", "postdoc", "phd", "research assistant"]):
        return "research"
    if any(k in text for k in ["competition", "contest", "olympiad"]):
        return "competition"
    if any(k in text for k in ["intern", "internship", "trainee", "apprentice"]):
        return "internship"
    return default


class ResearchOrchestrator:
    """Multi-stage AI research agent powered by SerpApi and Gemini."""

    def __init__(
        self,
        serpapi_key: Optional[str] = None,
        gemini_key: Optional[str] = None,
    ):
        self.web_client = WebSearchClient(api_key=serpapi_key)
        self.news_client = NewsSearchClient(api_key=serpapi_key)
        self.jobs_client = GoogleJobsClient(api_key=serpapi_key)
        self.planner = GeminiResearchPlanner(api_key=gemini_key)

    async def execute_research(self, request: SearchRequest) -> SearchResponse:
        start_time = time.time()
        query = request.query
        profile = request.profile

        logger.info("Starting research orchestration for query: '%s'", query)

        # 1. Plan queries using Gemini or heuristics
        plan = await self.planner.plan_search_queries(query, profile)
        logger.info("Research plan generated: %s", plan)

        # Filter queries according to requested categories if specified
        target_categories = set(request.categories) if request.categories else set()

        tasks = []
        is_live = False

        # Web search tasks
        if not target_categories or any(c in target_categories for c in [
            "scholarship",
            "hackathon",
            "fellowship",
            "research",
            "competition",
        ]):
            for q in plan.get("web_queries", [query])[:2]:
                tasks.append(self._safe_web_search(q))

        # News search tasks (announcements, deadline extensions)
        for q in plan.get("news_queries", [])[:1]:
            tasks.append(self._safe_news_search(q))

        # Jobs search tasks (internships, full-time roles)
        if not target_categories or any(c in target_categories for c in [
            "internship",
            "job",
        ]):
            for q in plan.get("job_queries", [f"{query} internship"])[:2]:
                tasks.append(self._safe_jobs_search(q, location=request.location))

        # Execute searches concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)

        raw_opportunities: List[Opportunity] = []
        seen_links: Set[str] = set()

        for res in results:
            if isinstance(res, Exception):
                logger.warning("Search task failed with exception: %s", res)
                continue
            if not res:
                continue

            opps, live_flag = res
            if live_flag:
                is_live = True

            for opp in opps:
                norm_link = (opp.source_url or "").strip().lower()
                if norm_link and norm_link in seen_links:
                    continue
                if norm_link:
                    seen_links.add(norm_link)
                raw_opportunities.append(opp)

        # 3. Ground evidence and analyze profile fit
        analyzed_opportunities: List[Opportunity] = []
        # Rank / score top opportunities
        for opp in raw_opportunities[:25]:
            fit_data = await self.planner.analyze_opportunity_fit(opp, profile)
            evidence = OpportunityEvidence(
                match_reasons=fit_data.get("match_reasons", []),
                verified_requirements=fit_data.get("verified_requirements", []),
                missing_information=fit_data.get("missing_information", []),
                potential_disqualifiers=fit_data.get("potential_disqualifiers", []),
                next_steps=fit_data.get("next_steps", []),
                deadline_confirmed=bool(opp.deadline),
                sources=[opp.source_url] if opp.source_url else [],
            )
            opp.match_score = fit_data.get("match_score", 70)
            opp.matchScore = opp.match_score
            opp.evidence = evidence
            analyzed_opportunities.append(opp)

        # Sort by match score descending
        analyzed_opportunities.sort(key=lambda o: o.match_score, reverse=True)

        elapsed = time.time() - start_time
        logger.info(
            "Research completed in %.2fs: %d opportunities found (live=%s)",
            elapsed,
            len(analyzed_opportunities),
            is_live,
        )

        return SearchResponse(
            opportunities=analyzed_opportunities,
            results=analyzed_opportunities,
            total_found=len(analyzed_opportunities),
            resultCount=len(analyzed_opportunities),
            is_live=is_live,
            enginesUsed=["google_web", "google_news", "google_jobs"],
            metadata={
                "elapsed_seconds": round(elapsed, 2),
                "plan": plan,
                "engines_used": ["google_web", "google_news", "google_jobs"],
                "gemini_active": self.planner.is_configured(),
            },
        )

    async def _safe_web_search(self, q: str):
        try:
            data = await self.web_client.search(q)
            opps = self._parse_web_results(data)
            return opps, True
        except Exception as e:
            logger.warning("Web search error for '%s': %s", q, e)
            return [], False

    async def _safe_news_search(self, q: str):
        try:
            data = await self.news_client.search(q)
            opps = self._parse_news_results(data)
            return opps, True
        except Exception as e:
            logger.warning("News search error for '%s': %s", q, e)
            return [], False

    async def _safe_jobs_search(self, q: str, location: Optional[str] = "India"):
        try:
            data = await self.jobs_client.search(q, location=location)
            opps = self._parse_jobs_results(data)
            return opps, True
        except Exception as e:
            logger.warning("Google Jobs error for '%s': %s", q, e)
            return [], False

    def _parse_web_results(self, data: Dict[str, Any]) -> List[Opportunity]:
        opps = []
        organic = data.get("organic_results", [])
        for item in organic:
            title = item.get("title", "").strip()
            link = item.get("link", "").strip()
            snippet = item.get("snippet", "").strip()
            source = item.get("source") or item.get("displayed_link", "Web Result")
            if not title or not link:
                continue

            category = _infer_category(title, snippet, default="scholarship")
            opps.append(
                Opportunity(
                    id=_generate_id(title, str(source), link),
                    title=title,
                    organization=str(source),
                    category=category,
                    location="Online / Flexible",
                    source_url=link,
                    snippet=snippet,
                    description=snippet,
                    source_engine="serpapi_web_search",
                )
            )
        return opps

    def _parse_news_results(self, data: Dict[str, Any]) -> List[Opportunity]:
        opps = []
        news_items = data.get("news_results", [])
        for item in news_items:
            title = item.get("title", "").strip()
            link = item.get("link", "").strip()
            snippet = item.get("snippet", "").strip()
            source_info = item.get("source", {})
            source = source_info.get("name", "News Source") if isinstance(source_info, dict) else str(source_info)
            date = item.get("date", "")
            if not title or not link:
                continue

            category = _infer_category(title, snippet, default="fellowship")
            opps.append(
                Opportunity(
                    id=_generate_id(title, source, link),
                    title=title,
                    organization=source,
                    category=category,
                    location="India / Global",
                    deadline=date if date else None,
                    source_url=link,
                    snippet=snippet,
                    description=snippet,
                    source_engine="serpapi_news_search",
                )
            )
        return opps

    def _parse_jobs_results(self, data: Dict[str, Any]) -> List[Opportunity]:
        opps = []
        jobs = data.get("jobs_results", [])
        for item in jobs:
            title = item.get("title", "").strip()
            company = item.get("company_name", "Leading Organization").strip()
            location = item.get("location", "India").strip()
            description = item.get("description", "").strip()
            apply_options = item.get("apply_options", [])
            link = ""
            if apply_options and isinstance(apply_options, list):
                link = apply_options[0].get("link", "")
            if not link:
                link = item.get("share_link", "")

            detected = item.get("detected_extensions", {})
            posted_at = detected.get("posted_at", "")
            schedule_type = detected.get("schedule_type", "")

            if not title:
                continue

            is_remote = "remote" in location.lower() or "work from home" in description.lower()
            category: OpportunityCategory = "internship" if "intern" in title.lower() else "job"

            opps.append(
                Opportunity(
                    id=_generate_id(title, company, link or title),
                    title=title,
                    organization=company,
                    category=category,
                    location=location,
                    is_remote=is_remote,
                    stipend_or_salary=schedule_type if schedule_type else None,
                    source_url=link,
                    snippet=description[:240] + ("..." if len(description) > 240 else ""),
                    description=description,
                    source_engine="serpapi_google_jobs",
                )
            )
        return opps
