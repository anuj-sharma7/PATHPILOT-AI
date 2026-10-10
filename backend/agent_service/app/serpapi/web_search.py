"""
PathPilot AI - SerpApi Search Tools: Web Search Integration
Wraps official `serpapi-search-tools` web_search function.
"""

import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional

from serpapi_search_tools import (
    SearchResultFormat,
    SearchResultMode,
    web_search,
)

logger = logging.getLogger("pathpilot.serpapi.web_search")


class WebSearchClient:
    """Async wrapper around the official serpapi-search-tools web_search callable."""

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
            "allowed_engines": ["google"],
            "default_engine": "google",
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
            self._search_fn = web_search(**init_kwargs)
        except Exception as e:
            logger.warning("Failed to initialize web_search tool: %s", e)
            self._search_fn = None

    def _execute_sync(self, query: str, **kwargs: Any) -> Dict[str, Any]:
        """Synchronously execute web_search."""
        if not self._search_fn:
            raise RuntimeError("Web search function is not initialized. Check SerpApi API key.")

        call_params = {"q": query}
        if kwargs:
            call_params.update(kwargs)

        raw_result = self._search_fn(call_params)

        if isinstance(raw_result, str):
            try:
                return json.loads(raw_result)
            except json.JSONDecodeError:
                return {"raw_text": raw_result}
        elif isinstance(raw_result, dict):
            return raw_result
        return {"data": raw_result}

    async def search(self, query: str, **kwargs: Any) -> Dict[str, Any]:
        """Execute web_search asynchronously via asyncio.to_thread."""
        return await asyncio.to_thread(self._execute_sync, query, **kwargs)
