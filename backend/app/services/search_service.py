"""
Service Elasticsearch pour l'indexation et la recherche d'articles.
Index : nexusblog_articles_{tenant_slug}
"""
from elasticsearch import AsyncElasticsearch, NotFoundError
from app.core.config import settings

_client: AsyncElasticsearch | None = None


def get_es() -> AsyncElasticsearch:
    global _client
    if _client is None:
        kwargs = {"hosts": [settings.ELASTICSEARCH_URL]}
        if settings.ELASTICSEARCH_API_KEY:
            kwargs["api_key"] = settings.ELASTICSEARCH_API_KEY
        _client = AsyncElasticsearch(**kwargs)
    return _client


def _index_name(tenant_slug: str) -> str:
    return f"nexusblog_{tenant_slug.replace('-', '_')}"


ARTICLE_MAPPING = {
    "mappings": {
        "properties": {
            "tenant_id":    {"type": "keyword"},
            "title":        {"type": "text", "analyzer": "standard", "fields": {"keyword": {"type": "keyword"}}},
            "slug":         {"type": "keyword"},
            "excerpt":      {"type": "text", "analyzer": "standard"},
            "content":      {"type": "text", "analyzer": "standard"},
            "category_id":  {"type": "keyword"},
            "category_name":{"type": "keyword"},
            "tags":         {"type": "keyword"},
            "author_id":    {"type": "keyword"},
            "author_name":  {"type": "text"},
            "status":       {"type": "keyword"},
            "visibility":   {"type": "keyword"},
            "article_type": {"type": "keyword"},
            "published_at": {"type": "date"},
            "cover_image_url": {"type": "keyword", "index": False},
            "reading_time_minutes": {"type": "integer"},
            "views_count":  {"type": "integer"},
            "likes_count":  {"type": "integer"},
        }
    },
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
    },
}


async def ensure_index(tenant_slug: str) -> None:
    es = get_es()
    index = _index_name(tenant_slug)
    exists = await es.indices.exists(index=index)
    if not exists:
        await es.indices.create(index=index, body=ARTICLE_MAPPING)


async def index_article(tenant_slug: str, article: dict) -> None:
    es = get_es()
    await ensure_index(tenant_slug)
    await es.index(
        index=_index_name(tenant_slug),
        id=article["id"],
        document=article,
    )


async def delete_article(tenant_slug: str, article_id: str) -> None:
    es = get_es()
    try:
        await es.delete(index=_index_name(tenant_slug), id=article_id)
    except NotFoundError:
        pass


async def search_articles(
    tenant_slug: str,
    q: str | None = None,
    category_id: str | None = None,
    tags: list[str] | None = None,
    article_type: str | None = None,
    status: str = "published",
    from_: int = 0,
    size: int = 10,
) -> dict:
    es = get_es()
    index = _index_name(tenant_slug)

    must = [{"term": {"status": status}}]
    filters = []

    if q:
        must.append({
            "multi_match": {
                "query": q,
                "fields": ["title^3", "excerpt^2", "content", "tags"],
                "fuzziness": "AUTO",
                "type": "best_fields",
            }
        })

    if category_id:
        filters.append({"term": {"category_id": category_id}})
    if tags:
        filters.append({"terms": {"tags": tags}})
    if article_type:
        filters.append({"term": {"article_type": article_type}})

    query = {
        "query": {"bool": {"must": must, "filter": filters}},
        "sort": (
            [{"_score": "desc"}, {"published_at": "desc"}]
            if q
            else [{"published_at": "desc"}]
        ),
        "from": from_,
        "size": size,
        "highlight": {
            "fields": {
                "title": {},
                "excerpt": {"fragment_size": 200, "number_of_fragments": 1},
            }
        } if q else {},
    }

    try:
        resp = await es.search(index=index, body=query)
    except NotFoundError:
        return {"total": 0, "hits": []}

    hits = []
    for h in resp["hits"]["hits"]:
        doc = h["_source"]
        doc["_score"] = h.get("_score")
        if "highlight" in h:
            doc["_highlight"] = h["highlight"]
        hits.append(doc)

    return {
        "total": resp["hits"]["total"]["value"],
        "hits": hits,
    }


async def close_es() -> None:
    global _client
    if _client:
        await _client.close()
        _client = None
