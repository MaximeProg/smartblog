from fastapi import HTTPException, status


class NexusBlogException(HTTPException):
    def __init__(self, error: str, message: str, status_code: int):
        super().__init__(status_code=status_code, detail={"error": error, "message": message})


# ── 401 ───────────────────────────────────────────────────────────

class UnauthorizedException(NexusBlogException):
    def __init__(self, message: str = "Authentification requise."):
        super().__init__("UNAUTHORIZED", message, status.HTTP_401_UNAUTHORIZED)


class InvalidTokenException(NexusBlogException):
    def __init__(self):
        super().__init__("INVALID_TOKEN", "Token invalide ou expiré.", status.HTTP_401_UNAUTHORIZED)


class TokenRevokedException(NexusBlogException):
    def __init__(self):
        super().__init__("TOKEN_REVOKED", "Ce token a été révoqué.", status.HTTP_401_UNAUTHORIZED)


# ── 403 ───────────────────────────────────────────────────────────

class ForbiddenException(NexusBlogException):
    def __init__(self, message: str = "Vous n'avez pas les permissions nécessaires."):
        super().__init__("FORBIDDEN", message, status.HTTP_403_FORBIDDEN)


# ── 404 ───────────────────────────────────────────────────────────

class NotFoundException(NexusBlogException):
    def __init__(self, resource: str = "Ressource"):
        super().__init__(
            f"{resource.upper()}_NOT_FOUND",
            f"{resource} introuvable.",
            status.HTTP_404_NOT_FOUND,
        )


class TenantNotFoundException(NexusBlogException):
    def __init__(self):
        super().__init__("TENANT_NOT_FOUND", "Blog introuvable.", status.HTTP_404_NOT_FOUND)


# ── 409 ───────────────────────────────────────────────────────────

class SlugAlreadyExistsException(NexusBlogException):
    def __init__(self, slug: str):
        super().__init__(
            "SLUG_ALREADY_EXISTS",
            f"Le slug '{slug}' est déjà utilisé.",
            status.HTTP_409_CONFLICT,
        )


class EmailAlreadyExistsException(NexusBlogException):
    def __init__(self):
        super().__init__(
            "EMAIL_ALREADY_EXISTS",
            "Cet email est déjà associé à un compte.",
            status.HTTP_409_CONFLICT,
        )


# ── 402 ───────────────────────────────────────────────────────────

class PlanLimitReachedException(NexusBlogException):
    def __init__(self, resource: str, limit: int):
        super().__init__(
            "PLAN_LIMIT_REACHED",
            f"Limite du plan atteinte pour '{resource}' (max {limit}). Passez à un plan supérieur.",
            status.HTTP_402_PAYMENT_REQUIRED,
        )


class AIQuotaExceededException(NexusBlogException):
    def __init__(self):
        super().__init__(
            "AI_QUOTA_EXCEEDED",
            "Quota IA mensuel épuisé. Passez à un plan supérieur.",
            status.HTTP_402_PAYMENT_REQUIRED,
        )


# ── 429 ───────────────────────────────────────────────────────────

class RateLimitExceededException(NexusBlogException):
    def __init__(self):
        super().__init__(
            "RATE_LIMIT_EXCEEDED",
            "Trop de requêtes. Réessayez dans quelques instants.",
            status.HTTP_429_TOO_MANY_REQUESTS,
        )


# ── 422 ───────────────────────────────────────────────────────────

class ValidationException(NexusBlogException):
    def __init__(self, message: str):
        super().__init__("VALIDATION_ERROR", message, status.HTTP_422_UNPROCESSABLE_ENTITY)
