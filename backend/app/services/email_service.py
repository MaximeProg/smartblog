"""
Service email via Resend API — templates professionnels NexusBlog.
"""
import resend
from app.core.config import settings

BRAND_BLUE   = "#3B82F6"
BRAND_DARK   = "#0F172A"
BRAND_TEXT   = "#475569"
BRAND_MUTED  = "#94A3B8"


def _client() -> None:
    resend.api_key = settings.RESEND_API_KEY


def _from() -> str:
    return f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>"


def _base(title: str, preview: str, body_html: str) -> str:
    """Template de base commun à tous les emails NexusBlog."""
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>{title}</title>
  <span style="display:none;max-height:0;overflow:hidden;">{preview}</span>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 16px;">
    <tr><td align="center">

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:{BRAND_BLUE};border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;">
            <span style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:8px 16px;">
              <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Nexus<span style="color:rgba(255,255,255,0.7);">Blog</span></span>
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:40px 40px 32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
            {body_html}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F8FAFC;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;color:{BRAND_MUTED};">
              © 2026 NexusBlog · Plateforme SaaS de blogging multi-tenant
            </p>
            <p style="margin:0;font-size:12px;color:{BRAND_MUTED};">
              Vous recevez cet email car vous avez un compte NexusBlog.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _btn(text: str, url: str, color: str = BRAND_BLUE) -> str:
    return f"""
    <p style="text-align:center;margin:28px 0 0;">
      <a href="{url}" style="display:inline-block;background:{color};color:#fff;
         font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;
         padding:14px 32px;letter-spacing:0.1px;">
        {text}
      </a>
    </p>"""


def _h1(text: str) -> str:
    return f'<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:{BRAND_DARK};letter-spacing:-0.5px;">{text}</h1>'


def _p(text: str) -> str:
    return f'<p style="margin:12px 0;font-size:15px;line-height:1.7;color:{BRAND_TEXT};">{text}</p>'


def _note(text: str) -> str:
    return f'<p style="margin:20px 0 0;font-size:12px;color:{BRAND_MUTED};line-height:1.6;">{text}</p>'


def _divider() -> str:
    return '<hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />'


async def _send(to: str | list[str], subject: str, html: str) -> None:
    if not settings.RESEND_API_KEY:
        return
    _client()
    resend.Emails.send({
        "from": _from(),
        "to": [to] if isinstance(to, str) else to,
        "subject": subject,
        "html": html,
    })


# ─── Invitations équipe ────────────────────────────────────────────

async def send_team_invitation(
    to: str,
    tenant_name: str,
    inviter_name: str,
    role: str,
    invite_url: str,
) -> None:
    body = (
        _h1(f"Vous êtes invité(e) à rejoindre {tenant_name}") +
        _p(f"<strong>{inviter_name}</strong> vous invite à collaborer sur "
           f"<strong>{tenant_name}</strong> en tant que <strong>{role}</strong>.") +
        _p("Cliquez sur le bouton ci-dessous pour accepter l'invitation et accéder à l'espace.") +
        _btn("Accepter l'invitation", invite_url) +
        _divider() +
        _note("Ce lien expire dans <strong>7 jours</strong>. Si vous n'attendiez pas cette invitation, ignorez cet email.")
    )
    await _send(
        to=to,
        subject=f"Invitation à rejoindre {tenant_name} sur NexusBlog",
        html=_base(
            title="Invitation NexusBlog",
            preview=f"{inviter_name} vous invite à rejoindre {tenant_name}",
            body_html=body,
        ),
    )


# ─── Newsletter ────────────────────────────────────────────────────

async def send_newsletter_confirmation(
    to: str,
    tenant_name: str,
    confirm_url: str,
) -> None:
    body = (
        _h1("Confirmez votre abonnement") +
        _p(f"Merci de votre intérêt pour <strong>{tenant_name}</strong> !") +
        _p("Cliquez ci-dessous pour confirmer votre adresse et activer votre abonnement à la newsletter.") +
        _btn("Confirmer mon abonnement", confirm_url, "#10B981") +
        _divider() +
        _note("Si vous n'avez pas demandé cet abonnement, ignorez simplement cet email.")
    )
    await _send(
        to=to,
        subject=f"Confirmez votre abonnement à {tenant_name}",
        html=_base(
            title="Confirmation d'abonnement",
            preview=f"Un clic suffit pour confirmer votre abonnement à {tenant_name}",
            body_html=body,
        ),
    )


async def send_newsletter_campaign(
    to: list[str],
    from_name: str,
    subject: str,
    html: str,
    unsubscribe_url: str,
) -> None:
    """Envoi d'une campagne newsletter via Resend (batches de 50)."""
    if not settings.RESEND_API_KEY:
        return
    _client()
    footer = f"""
    <hr style="border:none;border-top:1px solid #E2E8F0;margin:32px 0 16px;" />
    <p style="font-size:12px;color:{BRAND_MUTED};text-align:center;margin:0;">
      Vous recevez cet email car vous êtes abonné(e) à <strong>{from_name}</strong>. ·
      <a href="{unsubscribe_url}" style="color:{BRAND_MUTED};">Se désabonner</a>
    </p>
    """
    full_html = html + footer
    for i in range(0, len(to), 50):
        resend.Emails.send({
            "from": f"{from_name} <{settings.EMAIL_FROM_ADDRESS}>",
            "to": to[i:i + 50],
            "subject": subject,
            "html": full_html,
        })


# ─── Articles ──────────────────────────────────────────────────────

async def send_article_submitted_notification(
    to: list[str],
    article_title: str,
    author_name: str,
    review_url: str,
) -> None:
    if not to:
        return
    body = (
        _h1("Nouvel article en attente de validation") +
        _p(f"<strong>{author_name}</strong> a soumis l'article suivant pour relecture :") +
        f'<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-left:4px solid {BRAND_BLUE};border-radius:8px;padding:14px 18px;margin:16px 0;">'
        f'<p style="margin:0;font-size:14px;font-weight:600;color:{BRAND_DARK};">{article_title}</p>'
        f'</div>' +
        _p("Consultez et validez l'article depuis votre tableau de bord.") +
        _btn("Voir l'article", review_url, "#F59E0B")
    )
    await _send(
        to=to,
        subject=f"Article en attente : {article_title}",
        html=_base(
            title="Nouvel article soumis",
            preview=f"{author_name} a soumis « {article_title} » pour validation",
            body_html=body,
        ),
    )


async def send_article_published_notification(
    to: str,
    article_title: str,
    article_url: str,
) -> None:
    body = (
        _h1("Votre article est en ligne ! 🎉") +
        f'<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-left:4px solid #10B981;border-radius:8px;padding:14px 18px;margin:16px 0;">'
        f'<p style="margin:0;font-size:14px;font-weight:600;color:#065F46;">{article_title}</p>'
        f'</div>' +
        _p("Votre article vient d'être publié et est maintenant visible par tous vos lecteurs.") +
        _btn("Lire l'article publié", article_url, "#10B981")
    )
    await _send(
        to=to,
        subject=f"✅ Article publié : {article_title}",
        html=_base(
            title="Article publié",
            preview=f"Votre article « {article_title} » est maintenant en ligne",
            body_html=body,
        ),
    )


async def send_article_rejected_notification(
    to: str,
    article_title: str,
    reason: str | None,
    dashboard_url: str,
) -> None:
    reason_block = ""
    if reason:
        reason_block = (
            f'<div style="background:#FEF2F2;border:1px solid #FECACA;border-left:4px solid #EF4444;'
            f'border-radius:8px;padding:14px 18px;margin:16px 0;">'
            f'<p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:0.5px;">Commentaire de l\'éditeur</p>'
            f'<p style="margin:0;font-size:14px;color:#7F1D1D;">{reason}</p>'
            f'</div>'
        )
    body = (
        _h1("Votre article nécessite des modifications") +
        _p(f"L'article <strong>« {article_title} »</strong> a été retourné pour révision.") +
        reason_block +
        _p("Apportez les modifications demandées et soumettez à nouveau votre article.") +
        _btn("Modifier l'article", dashboard_url)
    )
    await _send(
        to=to,
        subject=f"Révision demandée : {article_title}",
        html=_base(
            title="Article retourné pour révision",
            preview=f"Des modifications sont demandées pour « {article_title} »",
            body_html=body,
        ),
    )


# ─── Auth ──────────────────────────────────────────────────────────

async def send_welcome_email(
    to: str,
    display_name: str,
    dashboard_url: str,
) -> None:
    name = display_name or "là"
    body = (
        _h1(f"Bienvenue sur NexusBlog, {name} ! 👋") +
        _p("Votre compte est prêt. Vous pouvez dès maintenant créer votre premier blog, "
           "publier des articles et développer votre audience.") +
        f'<table cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;">'
        f'<tr>'
        f'<td style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px 18px;width:33%;">'
        f'<p style="margin:0 0 4px;font-size:20px;">✍️</p>'
        f'<p style="margin:0;font-size:12px;font-weight:700;color:{BRAND_DARK};">Créer</p>'
        f'<p style="margin:0;font-size:11px;color:{BRAND_TEXT};">Publiez des articles</p>'
        f'</td>'
        f'<td width="8"></td>'
        f'<td style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px 18px;width:33%;">'
        f'<p style="margin:0 0 4px;font-size:20px;">📊</p>'
        f'<p style="margin:0;font-size:12px;font-weight:700;color:{BRAND_DARK};">Analyser</p>'
        f'<p style="margin:0;font-size:11px;color:{BRAND_TEXT};">Suivez vos stats</p>'
        f'</td>'
        f'<td width="8"></td>'
        f'<td style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px 18px;width:33%;">'
        f'<p style="margin:0 0 4px;font-size:20px;">💌</p>'
        f'<p style="margin:0;font-size:12px;font-weight:700;color:{BRAND_DARK};">Engager</p>'
        f'<p style="margin:0;font-size:11px;color:{BRAND_TEXT};">Newsletter intégrée</p>'
        f'</td>'
        f'</tr></table>' +
        _btn("Accéder à mon espace", dashboard_url) +
        _divider() +
        _note("Besoin d'aide ? Consultez notre documentation ou contactez notre équipe.")
    )
    await _send(
        to=to,
        subject="Bienvenue sur NexusBlog 🎉",
        html=_base(
            title="Bienvenue sur NexusBlog",
            preview=f"Bonjour {name} ! Votre compte NexusBlog est prêt.",
            body_html=body,
        ),
    )


async def send_2fa_backup_codes_email(
    to: str,
    display_name: str,
    backup_codes: list[str],
) -> None:
    codes_html = "".join(
        f'<tr><td style="padding:6px 12px;font-family:monospace;font-size:15px;'
        f'letter-spacing:3px;color:{BRAND_DARK};font-weight:600;">{c}</td></tr>'
        for c in backup_codes
    )
    body = (
        _h1("Vos codes de secours 2FA") +
        _p(f"Bonjour <strong>{display_name}</strong>,") +
        _p("La double authentification est maintenant activée sur votre compte. "
           "Conservez ces codes dans un endroit sûr — chaque code ne peut être utilisé <strong>qu'une seule fois</strong>.") +
        f'<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:8px;margin:20px 0;">'
        f'<table cellpadding="0" cellspacing="0" width="100%">{codes_html}</table>'
        f'</div>' +
        f'<div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:12px 16px;margin:16px 0;">'
        f'<p style="margin:0;font-size:13px;color:#92400E;font-weight:600;">⚠️ Ne partagez jamais ces codes. NexusBlog ne vous les demandera jamais.</p>'
        f'</div>' +
        _note("Si vous n'avez pas activé la 2FA, contactez immédiatement notre support.")
    )
    await _send(
        to=to,
        subject="🔐 Vos codes de secours NexusBlog (2FA)",
        html=_base(
            title="Codes de secours 2FA",
            preview="Conservez ces codes en lieu sûr — ils vous permettent d'accéder à votre compte sans votre téléphone",
            body_html=body,
        ),
    )
