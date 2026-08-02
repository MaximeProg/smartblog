from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.tenants import router as tenants_router
from app.api.v1.team import router as team_router, invitation_router
from app.api.v1.articles import router as articles_router
from app.api.v1.categories import router as categories_router
from app.api.v1.tags import router as tags_router
from app.api.v1.media import router as media_router
from app.api.v1.comments import router as comments_router, tenant_comments_router
from app.api.v1.newsletter import router as newsletter_router
from app.api.v1.social import router as social_router
from app.api.v1.oauth import router as oauth_router
from app.api.v1.ads import router as ads_router, public_ads_router, platform_ads_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.search import router as search_router
from app.api.v1.payments import router as payments_router, me_payments_router
from app.api.v1.push import router as push_router
from app.api.v1.ai import router as ai_router
from app.api.v1.superadmin import router as superadmin_router
from app.api.v1.webhooks import router as webhooks_router
from app.api.v1.public import router as public_router, explore_router
from app.api.v1.platform import router as platform_router
from app.api.v1.engagement import router as engagement_router
from app.api.v1.moderation import router as moderation_router
from app.api.v1.affiliate import user_router as affiliate_user_router, superadmin_router as affiliate_admin_router
from app.api.v1.accounting import router as accounting_router, tenant_accounting_router
from app.api.v1.domains import router as domains_router
from app.api.v1.bookmarks import router as bookmarks_router
from app.api.v1.api_keys import router as api_keys_router
from app.api.v1.support import router as support_router
from app.api.v1.kyc import router as kyc_router
from app.api.v1.invoices import router as invoices_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(tenants_router)
api_router.include_router(team_router)
api_router.include_router(invitation_router)
api_router.include_router(articles_router)
api_router.include_router(categories_router)
api_router.include_router(tags_router)
api_router.include_router(media_router)
api_router.include_router(comments_router)
api_router.include_router(tenant_comments_router)
api_router.include_router(newsletter_router)
api_router.include_router(social_router)
api_router.include_router(oauth_router)
api_router.include_router(ads_router)
api_router.include_router(public_ads_router)
api_router.include_router(platform_ads_router)
api_router.include_router(analytics_router)
api_router.include_router(search_router)
api_router.include_router(payments_router)
api_router.include_router(me_payments_router)
api_router.include_router(push_router)
api_router.include_router(ai_router)
api_router.include_router(superadmin_router)
api_router.include_router(webhooks_router)
api_router.include_router(engagement_router)
api_router.include_router(moderation_router)
api_router.include_router(affiliate_user_router)
api_router.include_router(affiliate_admin_router)
api_router.include_router(accounting_router)
api_router.include_router(tenant_accounting_router)
api_router.include_router(domains_router)
api_router.include_router(bookmarks_router)
api_router.include_router(api_keys_router)
api_router.include_router(support_router)
api_router.include_router(kyc_router)
api_router.include_router(invoices_router)
api_router.include_router(explore_router)  # must be before public_router (no slug conflict)
api_router.include_router(public_router)
api_router.include_router(platform_router)
