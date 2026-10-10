"""
PathPilot AI - SerpApi Search Tools: News Search Integration
Wraps official `serpapi-search-tools` news_search function with resilient error handling.
"""

import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional

from serpapi_search_tools import (
    SearchResultFormat,
    SearchResultMode,
    news_search,
)

logger = logging.getLogger("pathpilot.serpapi.news_search")


class NewsSearchClient:
    """Async wrapper around the official serpapi-search-tools news_search callable."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (
            api_key
            or os.environ.get("SERPAPI_API_KEY")
            or os.environ.get("SERPAPI_KEY")
        )
        if self.api_key:
            os.environ.setdefault("SERPAPI_API_KEY", self.api_key)

        init_kwargs: Dict[str, Any] = {
            "provider": "function",
            "default_params": {
                "gl": "in",
                "hl": "en",
            },
            "mode": SearchResultMode.COMPACT,
            "response_format": SearchResultFormat.JSON,
        }
        if self.api_key:
            init_kwargs["api_key"] = self.api_key

        try:
            self._search_fn = news_search(**init_kwargs)
        except Exception as e:
            logger.warning("Failed to initialize news_search tool: %s", str(e))
            self._search_fn = None

    def _execute_sync(self, query: str, **kwargs: Any) -> Dict[str, Any]:
        """Synchronously execute news_search with safe error boundaries."""
        if not self.api_key:
            logger.warning("News search aborted: SERPAPI_API_KEY is not configured.")
            return {"news_results": [], "warning": "Credentials missing"}

        if not self._search_fn:
            raise RuntimeError("News search tool is uninitialized.")

        query = (query or "").strip()
        if not query:
            return {"news_results": []}

        try:
            raw_result = self._search_fn(query=query)
        except Exception as e:
            logger.error("News search failed: %s", str(e))
            return {"news_results": [], "error": "Search execution failed"}

        if isinstance(raw_result, str):
            try:
                return json.loads(raw_result)
            except json.JSONDecodeError:
                return {"raw_text": raw_result, "news_results": []}
        elif isinstance(raw_result, dict):
            return raw_result
        return {"data": raw_result, "news_results": []}

    async def search(self, query: str, **kwargs: Any) -> Dict[str, Any]:
        """Execute news_search asynchronously via asyncio.to_thread with timeout handling."""
        try:
            return await asyncio.wait_for(
                asyncio.to_thread(self._execute_sync, query, **kwargs),
                timeout=18.0,
            )
        except asyncio.TimeoutError:
            logger.warning("News search query timed out after 18 seconds.")
            return {"news_results": [], "error": "Search request timed out"}
