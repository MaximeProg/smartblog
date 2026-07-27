from pydantic import BaseModel, EmailStr, field_validator, PrivateAttr
from app.models.enums import UserRole, PlanTier


class FirebaseLoginRequest(BaseModel):
    firebase_id_token: str
    referral_code: str | None = None


class TenantInfo(BaseModel):
    id: str
    name: str
    slug: str
    plan: PlanTier
    role: UserRole

    model_config = {"from_attributes": True}

    @field_validator("id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if v is not None else v


class UserInfo(BaseModel):
    id: str
    email: str
    display_name: str | None
    avatar_url: str | None
    bio: str | None = None
    phone: str | None = None
    country: str | None = None
    continent: str | None = None
    gender: str | None = None
    plan: PlanTier = PlanTier.FREE
    is_super_admin: bool
    two_fa_enabled: bool
    usdt_wallet_address: str | None = None
    payout_currency: str | None = None
    payout_extra_id: str | None = None

    model_config = {"from_attributes": True}

    @field_validator("id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if v is not None else v


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserInfo
    tenants: list[TenantInfo] = []
    requires_2fa: bool = False
    two_fa_challenge_token: str | None = None  # flux natif (email/mot de passe) uniquement

    _refresh_token: str = PrivateAttr(default="")


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TwoFASetupResponse(BaseModel):
    otpauth_uri: str
    qr_code_svg: str
    backup_codes: list[str]


class TwoFAVerifyRequest(BaseModel):
    code: str


class TwoFADisableRequest(BaseModel):
    code: str


class TwoFALoginRequest(BaseModel):
    firebase_id_token: str
    code: str


class UpdateProfileRequest(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    phone: str | None = None
    country: str | None = None
    continent: str | None = None
    gender: str | None = None


# ── Authentification native (email/mot de passe, sans Firebase) ───

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str | None = None
    referral_code: str | None = None
    locale: str = "en"

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v


class LoginPasswordRequest(BaseModel):
    email: EmailStr
    password: str


class TwoFALoginPasswordRequest(BaseModel):
    challenge_token: str
    code: str


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr
    locale: str = "en"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    locale: str = "en"


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v
