"""Social publisher — posts articles to connected social platforms."""
from __future__ import annotations

import httpx
import structlog

from app.models.social import SocialAccount
from app.core.security import decrypt_value

logger = structlog.get_logger()


async def publish_article(
    account: SocialAccount,
    article_url: str,
    title: str,
    excerpt: str | None,
    cover_url: str | None,
) -> tuple[str | None, str | None]:
    """Publishes an article to the given social account. Returns (post_url, error_message)."""
    if not account.access_token_enc:
        return None, "No access token stored"

    access_token = decrypt_value(account.access_token_enc)
    platform = account.platform.value

    try:
        if platform == "facebook":
            return await _post_facebook(access_token, account.platform_user_id, article_url, title, excerpt)
        if platform == "linkedin":
            return await _post_linkedin(access_token, account.platform_user_id, article_url, title, excerpt)
        if platform == "twitter":
            return await _post_twitter(access_token, article_url, title)
        if platform == "tiktok":
            return await _post_tiktok(access_token, article_url, title)
        return None, f"Auto-post not supported for {platform}"
    except Exception as exc:
        logger.warning("social_publish_error", platform=platform, error=str(exc))
        return None, str(exc)[:300]


async def _post_facebook(
    access_token: str,
    page_id: str,
    article_url: str,
    title: str,
    excerpt: str | None,
) -> tuple[str | None, str | None]:
    message = f"{title}\n\n{excerpt or ''}\n\n{article_url}".strip()
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"https://graph.facebook.com/v19.0/{page_id}/feed",
            params={"message": message, "link": article_url, "access_token": access_token},
        )
    if resp.status_code == 200:
        post_id = resp.json().get("id", "")
        parts = post_id.split("_")
        url = f"https://www.facebook.com/{parts[0]}/posts/{parts[1]}" if len(parts) == 2 else None
        return url, None
    return None, resp.text[:200]


async def _post_linkedin(
    access_token: str,
    author_id: str,
    article_url: str,
    title: str,
    excerpt: str | None,
) -> tuple[str | None, str | None]:
    author_urn = author_id if author_id.startswith("urn:") else f"urn:li:person:{author_id}"
    commentary = f"{title}\n\n{excerpt or ''}\n\n{article_url}"[:3000].strip()

    body = {
        "author": author_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": commentary},
                "shareMediaCategory": "ARTICLE",
                "media": [{
                    "status": "READY",
                    "description": {"text": (excerpt or title)[:200]},
                    "originalUrl": article_url,
                    "title": {"text": title[:200]},
                }],
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://api.linkedin.com/v2/ugcPosts",
            json=body,
            headers={
                "Authorization": f"Bearer {access_token}",
                "X-Restli-Protocol-Version": "2.0.0",
            },
        )
    if resp.status_code == 201:
        post_id = resp.json().get("id", "")
        url = f"https://www.linkedin.com/feed/update/{post_id}" if post_id else None
        return url, None
    return None, resp.text[:200]


async def _post_twitter(
    access_token: str,
    article_url: str,
    title: str,
) -> tuple[str | None, str | None]:
    # Fit within 280 chars: title + newline + URL
    max_title = 280 - len(article_url) - 2
    truncated = title[:max_title] if len(title) > max_title else title
    tweet = f"{truncated}\n{article_url}"

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://api.twitter.com/2/tweets",
            json={"text": tweet},
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if resp.status_code in (200, 201):
        tweet_id = resp.json().get("data", {}).get("id", "")
        url = f"https://twitter.com/i/web/status/{tweet_id}" if tweet_id else None
        return url, None
    return None, resp.text[:200]


async def _post_tiktok(
    access_token: str,
    article_url: str,
    title: str,
) -> tuple[str | None, str | None]:
    # TikTok text/link posts require the Content Posting API with Creator approval.
    # Video upload is supported; plain article links are not directly supported.
    return None, "TikTok text post not supported — use video upload API instead"
