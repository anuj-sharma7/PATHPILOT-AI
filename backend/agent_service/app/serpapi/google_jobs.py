"""
PathPilot AI - Direct SerpApi Google Jobs Integration
Uses httpx.AsyncClient to query the SerpApi Google Jobs engine directly.
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
        """Fetch jobs from SerpApi Google Jobs engine."""
        if not self.api_key:
            raise RuntimeError("SERPAPI_API_KEY is not configured.")

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

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(SERPAPI_URL, params=params)
            resp.raise_for_status()
            return resp.json()
