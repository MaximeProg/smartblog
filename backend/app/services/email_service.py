"""
Service email via Resend.
Toutes les fonctions sont async-friendly (l'appel SDK est synchrone
mais léger — pas besoin de run_in_executor pour ce volume).
"""
import resend
from app.core.config import settings


def _client() -> None:
    resend.api_key = settings.RESEND_API_KEY


def _from() -> str:
    return f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>"


# ─── Invitations équipe ────────────────────────────────────────────

async def send_team_invitation(
    to: str,
    tenant_name: str,
    inviter_name: str,
    role: str,
    invite_url: str,
) -> None:
    _client()
    resend.Emails.send(resend.Emails.SendParams(
        from_=_from(),
        to=[to],
        subject=f"Invitation à rejoindre {tenant_name} sur NexusBlog",
        html=f"""
        <h2>Vous avez été invité(e) à rejoindre <strong>{tenant_name}</strong></h2>
        <p><strong>{inviter_name}</strong> vous invite à rejoindre son équipe
        en tant que <strong>{role}</strong>.</p>
        <p>
            <a href="{invite_url}"
               style="background:#3b82f6;color:white;padding:12px 24px;
                      border-radius:6px;text-decoration:none;display:inline-block;">
                Accepter l'invitation
            </a>
        </p>
        <p style="color:#6b7280;font-size:14px;">
            Ce lien expire dans 7 jours.
        </p>
        """,
    ))


# ─── Newsletter ────────────────────────────────────────────────────

async def send_newsletter_confirmation(
    to: str,
    tenant_name: str,
    confirm_url: str,
) -> None:
    _client()
    resend.Emails.send(resend.Emails.SendParams(
        from_=_from(),
        to=[to],
        subject=f"Confirmez votre abonnement à {tenant_name}",
        html=f"""
        <h2>Confirmer votre abonnement</h2>
        <p>Merci de vous être abonné(e) à <strong>{tenant_name}</strong>.</p>
        <p>Cliquez sur le bouton ci-dessous pour confirmer votre abonnement :</p>
        <p>
            <a href="{confirm_url}"
               style="background:#10b981;color:white;padding:12px 24px;
                      border-radius:6px;text-decoration:none;display:inline-block;">
                Confirmer mon abonnement
            </a>
        </p>
        <p style="color:#6b7280;font-size:14px;">
            Si vous n'avez pas demandé cet abonnement, ignorez cet email.
        </p>
        """,
    ))


async def send_newsletter_campaign(
    to: list[str],
    from_name: str,
    subject: str,
    html: str,
    unsubscribe_url: str,
) -> None:
    """Envoi d'une campagne newsletter (batch de 50 max par appel Resend)."""
    _client()
    html_with_footer = html + f"""
    <hr style="margin-top:40px;border:none;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;text-align:center;">
        <a href="{unsubscribe_url}" style="color:#9ca3af;">Se désabonner</a>
    </p>
    """
    for i in range(0, len(to), 50):
        batch = to[i:i+50]
        resend.Emails.send(resend.Emails.SendParams(
            from_=f"{from_name} <{settings.EMAIL_FROM_ADDRESS}>",
            to=batch,
            subject=subject,
            html=html_with_footer,
        ))


# ─── Auth ──────────────────────────────────────────────────────────

async def send_2fa_backup_codes_email(
    to: str,
    display_name: str,
    backup_codes: list[str],
) -> None:
    _client()
    codes_html = "".join(
        f"<li style='font-family:monospace;font-size:16px;'>{c}</li>"
        for c in backup_codes
    )
    resend.Emails.send(resend.Emails.SendParams(
        from_=_from(),
        to=[to],
        subject="Vos codes de secours NexusBlog (2FA)",
        html=f"""
        <h2>Codes de secours — Double authentification</h2>
        <p>Bonjour {display_name},</p>
        <p>Voici vos codes de secours. Conservez-les dans un endroit sûr.
        Chaque code ne peut être utilisé qu'une seule fois.</p>
        <ul>{codes_html}</ul>
        <p style="color:#ef4444;font-weight:bold;">
            Ne partagez jamais ces codes.
        </p>
        """,
    ))
