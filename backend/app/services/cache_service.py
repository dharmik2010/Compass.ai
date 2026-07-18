import json
from typing import Any, Optional, Callable
from datetime import timedelta

from ..config import settings


class CacheService:
    _redis = None

    async def _get_redis(self):
        if self._redis is None:
            try:
                import redis.asyncio as aioredis
                self._redis = aioredis.from_url(
                    settings.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=2,
                    socket_timeout=2,
                )
                await self._redis.ping()
            except Exception:
                self._redis = False
        return self._redis if self._redis is not False else None

    async def get(self, key: str) -> Optional[Any]:
        r = await self._get_redis()
        if not r:
            return None
        try:
            val = await r.get(key)
            if val:
                return json.loads(val)
        except Exception:
            pass
        return None

    async def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        r = await self._get_redis()
        if not r:
            return False
        try:
            await r.setex(key, ttl, json.dumps(value, default=str))
            return True
        except Exception:
            return False

    async def delete(self, key: str) -> bool:
        r = await self._get_redis()
        if not r:
            return False
        try:
            await r.delete(key)
            return True
        except Exception:
            return False

    async def get_or_compute(
        self, key: str, compute_fn: Callable, ttl: int = 300
    ) -> Any:
        cached = await self.get(key)
        if cached is not None:
            return cached
        value = await compute_fn()
        await self.set(key, value, ttl)
        return value


cache_service = CacheService()
