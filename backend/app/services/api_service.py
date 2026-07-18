from typing import Any, Callable, Optional, Dict
import asyncio

from .cache_service import cache_service


class APIWithFallback:
    DEFAULT_TIMEOUT = 10.0

    async def call(
        self,
        primary_fn: Callable,
        fallback_fn: Optional[Callable] = None,
        cache_key: Optional[str] = None,
        cache_ttl: int = 300,
        timeout: float = DEFAULT_TIMEOUT,
    ) -> Dict[str, Any]:
        if cache_key:
            cached = await cache_service.get(cache_key)
            if cached is not None:
                return {"source": "cache", "data": cached}

        try:
            result = await asyncio.wait_for(primary_fn(), timeout=timeout)
            if cache_key:
                await cache_service.set(cache_key, result, ttl=cache_ttl)
            return {"source": "primary", "data": result}
        except asyncio.TimeoutError:
            pass
        except Exception:
            pass

        if fallback_fn:
            try:
                result = await fallback_fn()
                return {"source": "fallback", "data": result}
            except Exception:
                pass

        if cache_key:
            stale = await cache_service.get(f"stale:{cache_key}")
            if stale is not None:
                return {"source": "stale_cache", "data": stale}

        return {"source": "error", "data": None}

    async def call_with_retry(
        self,
        fn: Callable,
        retries: int = 3,
        backoff: float = 1.0,
        cache_key: Optional[str] = None,
        cache_ttl: int = 300,
    ) -> Dict[str, Any]:
        if cache_key:
            cached = await cache_service.get(cache_key)
            if cached is not None:
                return {"source": "cache", "data": cached}

        last_error = None
        for attempt in range(retries):
            try:
                result = await fn()
                if cache_key:
                    await cache_service.set(cache_key, result, ttl=cache_ttl)
                    await cache_service.set(f"stale:{cache_key}", result, ttl=86400)
                return {"source": "primary", "data": result}
            except Exception as e:
                last_error = e
                if attempt < retries - 1:
                    await asyncio.sleep(backoff * (2 ** attempt))

        if cache_key:
            stale = await cache_service.get(f"stale:{cache_key}")
            if stale is not None:
                return {"source": "stale_cache", "data": stale}

        return {"source": "error", "data": None, "error": str(last_error)}


api_with_fallback = APIWithFallback()
