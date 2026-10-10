"""
PathPilot AI - Direct SerpApi Google Jobs Integration
Uses httpx.AsyncClient to query the SerpApi Google Jobs engine directly with safe error boundaries.
"""

import logging
import os
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger("pathpilot.serpapi.google_jobs")

SERPAPI_URL = "https://serpapi.com/search.json"


class GoogleJobsClient:
    """Async client for SerpApi Google Jobs endpoint."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (
            api_key
            or os.environ.get("SERPAPI_API_KEY")
            or os.environ.get("SERPAPI_KEY")
        )

    async def search(
        self,
        query: str,
        location: Optional[str] = "India",
        hl: str = "en",
        gl: str = "in",
        **kwargs: Any,
    ) -> Dict[str, Any]:
        """Fetch jobs from SerpApi Google Jobs engine safely."""
        if not self.api_key:
            logger.warning("Google Jobs search skipped: SERPAPI_API_KEY is not configured.")
            return {"jobs_results": [], "warning": "Credentials missing"}

        params: Dict[str, Any] = {
            "engine": "google_jobs",
            "q": query,
            "api_key": self.api_key,
            "hl": hl,
            "gl": gl,
        }
        if location:
            params["location"] = location
        params.update(kwargs)

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(SERPAPI_URL, params=params)
                if resp.status_code == 401:
                    logger.error("SerpApi returned 401 Unauthorized. Verify your SERPAPI_API_KEY.")
                    return {"jobs_results": [], "error": "Invalid API key"}
                elif resp.status_code == 429:
                    logger.error("SerpApi rate limit/quota reached (429).")
                    return {"jobs_results": [], "error": "Quota limit reached"}
                resp.raise_for_status()
                return resp.json()
        except httpx.TimeoutException:
            logger.warning("Google Jobs query timed out.")
            return {"jobs_results": [], "error": "Request timed out"}
        except Exception as e:
            logger.error("Google Jobs search failed: %s", str(e))
            return {"jobs_results": [], "error": "Search failed"}
