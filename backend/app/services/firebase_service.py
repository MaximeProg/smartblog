import os
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from app.core.config import settings


_firebase_app: firebase_admin.App | None = None


def get_firebase_app() -> firebase_admin.App:
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    cred_dict = {
        "type": "service_account",
        "project_id": settings.FIREBASE_PROJECT_ID,
        "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
        "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
        "client_email": settings.FIREBASE_CLIENT_EMAIL,
        "client_id": settings.FIREBASE_CLIENT_ID,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
    }

    cred = credentials.Certificate(cred_dict)
    _firebase_app = firebase_admin.initialize_app(cred)
    return _firebase_app


async def verify_firebase_id_token(id_token: str) -> dict:
    """
    Vérifie un Firebase ID Token et retourne le payload décodé.
    Lève firebase_admin.auth.InvalidIdTokenError si invalide.
    """
    import asyncio
    get_firebase_app()
    # verify_id_token is synchronous and fetches Google public keys on first call.
    # Run in thread pool to avoid blocking the async event loop.
    decoded = await asyncio.to_thread(firebase_auth.verify_id_token, id_token)

    # Identifier le provider (google.com, password, github.com, etc.)
    sign_in_provider = decoded.get("firebase", {}).get("sign_in_provider", "unknown")
    email_verified = decoded.get("email_verified", False)

    # Les comptes email/password doivent avoir vérifié leur adresse (prod uniquement)
    from app.core.config import settings
    if sign_in_provider == "password" and not email_verified and settings.is_production:
        raise ValueError("EMAIL_NOT_VERIFIED")

    return {
        "uid": decoded["uid"],
        "email": decoded.get("email", ""),
        "name": decoded.get("name"),
        "picture": decoded.get("picture"),
        "email_verified": email_verified,
        "sign_in_provider": sign_in_provider,
    }
