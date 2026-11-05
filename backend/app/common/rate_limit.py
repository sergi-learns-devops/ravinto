"""Small in-process sliding-window rate limiter.

It is intentionally dependency-free. Note that with multiple workers each
worker keeps its own counters, so it complements (but does not replace) rate
limiting at the reverse proxy.
"""

import asyncio
import time
from collections import defaultdict, deque

from fastapi import Request

from app.common.exceptions import RateLimitException


class SlidingWindowRateLimiter:
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()
        self._calls = 0

    async def __call__(self, request: Request) -> None:
        client = request.client.host if request.client else "unknown"
        key = f"{client}:{request.url.path}"
        now = time.monotonic()

        async with self._lock:
            hits = self._hits[key]
            cutoff = now - self.window_seconds
            while hits and hits[0] <= cutoff:
                hits.popleft()

            if len(hits) >= self.limit:
                retry_after = max(1, int(self.window_seconds - (now - hits[0])) + 1)
                raise RateLimitException(retry_after=retry_after)

            hits.append(now)
            self._calls += 1
            if self._calls % 1000 == 0:
                self._prune(now)

    def _prune(self, now: float) -> None:
        cutoff = now - self.window_seconds
        stale = [key for key, hits in self._hits.items() if not hits or hits[-1] <= cutoff]
        for key in stale:
            self._hits.pop(key, None)


login_rate_limit = SlidingWindowRateLimiter(limit=10, window_seconds=300)
register_rate_limit = SlidingWindowRateLimiter(limit=5, window_seconds=3600)
refresh_rate_limit = SlidingWindowRateLimiter(limit=60, window_seconds=300)
export_rate_limit = SlidingWindowRateLimiter(limit=10, window_seconds=3600)
