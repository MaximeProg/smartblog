from fastapi import HTTPException, status


class SmarterBloggersException(HTTPException):
    def __init__(self, error: str, message: str, status_code: int):
        super().__init__(status_code=status_code, detail={"error": error, "message": message})


# ── 401 ───────────────────────────────────────────────────────────

class UnauthorizedException(SmarterBloggersException):
    def __init__(self, message: str = "Authentication required."):
        super().__init__("UNAUTHORIZED", message, status.HTTP_401_UNAUTHORIZED)


class InvalidTokenException(SmarterBloggersException):
    def __init__(self):
        super().__init__("INVALID_TOKEN", "Invalid or expired token.", status.HTTP_401_UNAUTHORIZED)


class TokenRevokedException(SmarterBloggersException):
    def __init__(self):
        super().__init__("TOKEN_REVOKED", "This token has been revoked.", status.HTTP_401_UNAUTHORIZED)


# ── 403 ───────────────────────────────────────────────────────────

class ForbiddenException(SmarterBloggersException):
    def __init__(self, message: str = "You don't have the required permissions."):
        super().__init__("FORBIDDEN", message, status.HTTP_403_FORBIDDEN)


# ── 404 ───────────────────────────────────────────────────────────

class NotFoundException(SmarterBloggersException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            f"{resource.upper()}_NOT_FOUND",
            f"{resource} not found.",
            status.HTTP_404_NOT_FOUND,
        )


class TenantNotFoundException(SmarterBloggersException):
    def __init__(self):
        super().__init__("TENANT_NOT_FOUND", "Blog not found.", status.HTTP_404_NOT_FOUND)


# ── 409 ───────────────────────────────────────────────────────────

class SlugAlreadyExistsException(SmarterBloggersException):
    def __init__(self, slug: str):
        super().__init__(
            "SLUG_ALREADY_EXISTS",
            f"The slug '{slug}' is already in use.",
            status.HTTP_409_CONFLICT,
        )


class EmailAlreadyExistsException(SmarterBloggersException):
    def __init__(self):
        super().__init__(
            "EMAIL_ALREADY_EXISTS",
            "This email is already associated with an account.",
            status.HTTP_409_CONFLICT,
        )


# ── 402 ───────────────────────────────────────────────────────────

class PlanLimitReachedException(SmarterBloggersException):
    def __init__(self, resource: str, limit: int):
        super().__init__(
            "PLAN_LIMIT_REACHED",
            f"Plan limit reached for '{resource}' (max {limit}). Upgrade to a higher plan.",
            status.HTTP_402_PAYMENT_REQUIRED,
        )


class AIQuotaExceededException(SmarterBloggersException):
    def __init__(self):
        super().__init__(
            "AI_QUOTA_EXCEEDED",
            "Monthly AI quota exhausted. Upgrade to a higher plan.",
            status.HTTP_402_PAYMENT_REQUIRED,
        )


# ── 429 ───────────────────────────────────────────────────────────

class RateLimitExceededException(SmarterBloggersException):
    def __init__(self):
        super().__init__(
            "RATE_LIMIT_EXCEEDED",
            "Too many requests. Please try again in a moment.",
            status.HTTP_429_TOO_MANY_REQUESTS,
        )


# ── 422 ───────────────────────────────────────────────────────────

class ValidationException(SmarterBloggersException):
    def __init__(self, message: str):
        super().__init__("VALIDATION_ERROR", message, status.HTTP_422_UNPROCESSABLE_ENTITY)
