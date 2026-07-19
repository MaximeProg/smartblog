"""
Service email via Resend API — templates professionnels SmarterBloggers.
"""
import structlog
import resend
from app.core.config import settings

logger = structlog.get_logger()

BRAND_BLUE   = "#3B82F6"
BRAND_DARK   = "#0F172A"
BRAND_TEXT   = "#475569"
BRAND_MUTED  = "#94A3B8"


def _client() -> None:
    resend.api_key = settings.RESEND_API_KEY


def _from() -> str:
    return f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>"


def _base(title: str, preview: str, body_html: str) -> str:
    """Template de base commun à tous les emails SmarterBloggers."""
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
              <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">Smarter<span style="color:rgba(255,255,255,0.7);">Bloggers</span></span>
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
              © 2026 SmarterBloggers · Plateforme SaaS de blogging multi-tenant
            </p>
            <p style="margin:0;font-size:12px;color:{BRAND_MUTED};">
              Vous recevez cet email car vous avez un compte SmarterBloggers.
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
        logger.warning("email._send: RESEND_API_KEY not configured, skipping")
        return
    _client()
    recipients = [to] if isinstance(to, str) else to
    sender = _from()
    logger.info("email._send: sending", to=recipients, subject=subject, sender=sender)
    try:
        result = resend.Emails.send({
            "from": sender,
            "to": recipients,
            "subject": subject,
            "html": html,
        })
        logger.info("email._send: sent", result=str(result))
    except Exception as exc:
        logger.error("email._send: resend API error", error=str(exc), to=recipients, subject=subject)
        raise


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
        subject=f"Invitation à rejoindre {tenant_name} sur SmarterBloggers",
        html=_base(
            title="Invitation SmarterBloggers",
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


async def send_newsletter_welcome_subscriber(
    to: str,
    blog_name: str,
    blog_url: str,
    language: str = "en",
) -> None:
    """Welcome email sent to a new newsletter subscriber, in the blog's default language."""
    is_fr = language.lower().startswith("fr")
    if is_fr:
        subject = f"Bienvenue sur la newsletter de {blog_name} !"
        preview = f"Vous êtes maintenant abonné(e) à {blog_name}"
        body = (
            _h1(f"Merci de votre abonnement à {blog_name} !") +
            _p("Vous venez de vous abonner à notre newsletter. Vous serez parmi les premiers à recevoir "
               "nos nouveaux articles, actualités et contenus exclusifs.") +
            _btn(f"Visiter {blog_name}", blog_url, "#10B981") +
            _divider() +
            _note("Vous pouvez vous désabonner à tout moment en cliquant sur le lien de désabonnement "
                  "présent dans chaque email.")
        )
    else:
        subject = f"Welcome to {blog_name}'s newsletter!"
        preview = f"You're now subscribed to {blog_name}"
        body = (
            _h1(f"Thanks for subscribing to {blog_name}!") +
            _p("You've successfully subscribed to our newsletter. You'll be among the first to receive "
               "our latest articles, news, and exclusive content.") +
            _btn(f"Visit {blog_name}", blog_url, "#10B981") +
            _divider() +
            _note("You can unsubscribe at any time by clicking the unsubscribe link in any of our emails.")
        )
    await _send(
        to=to,
        subject=subject,
        html=_base(title=subject, preview=preview, body_html=body),
    )


async def send_newsletter_owner_notification(
    to: str,
    blog_name: str,
    subscriber_email: str,
    language: str = "en",
) -> None:
    """Notification sent to the blog owner when someone subscribes to their newsletter."""
    is_fr = language.lower().startswith("fr")
    if is_fr:
        subject = f"Nouvel abonné sur {blog_name}"
        preview = f"{subscriber_email} vient de s'abonner à votre newsletter"
        body = (
            _h1("Vous avez un nouvel abonné !") +
            _p(f"Bonne nouvelle ! <strong>{subscriber_email}</strong> vient de s'abonner à la newsletter "
               f"de <strong>{blog_name}</strong>.") +
            f'<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-left:4px solid #10B981;'
            f'border-radius:8px;padding:14px 18px;margin:20px 0;">'
            f'<p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#065F46;'
            f'text-transform:uppercase;letter-spacing:0.5px;">Nouvel abonné</p>'
            f'<p style="margin:0;font-size:15px;font-weight:600;color:#065F46;">{subscriber_email}</p>'
            f'</div>' +
            _p("Continuez à publier du contenu de qualité pour fidéliser votre audience !") +
            _divider() +
            _note("Vous recevez cet email car vous êtes propriétaire du blog.")
        )
    else:
        subject = f"New subscriber on {blog_name}"
        preview = f"{subscriber_email} just subscribed to your newsletter"
        body = (
            _h1("You have a new subscriber!") +
            _p(f"Great news! <strong>{subscriber_email}</strong> just subscribed to the newsletter "
               f"of <strong>{blog_name}</strong>.") +
            f'<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-left:4px solid #10B981;'
            f'border-radius:8px;padding:14px 18px;margin:20px 0;">'
            f'<p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#065F46;'
            f'text-transform:uppercase;letter-spacing:0.5px;">New subscriber</p>'
            f'<p style="margin:0;font-size:15px;font-weight:600;color:#065F46;">{subscriber_email}</p>'
            f'</div>' +
            _p("Keep publishing great content to grow and retain your audience!") +
            _divider() +
            _note("You receive this email because you are the owner of this blog.")
        )
    await _send(
        to=to,
        subject=subject,
        html=_base(title=subject, preview=preview, body_html=body),
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
        _h1(f"Bienvenue sur SmarterBloggers, {name} ! 👋") +
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
        subject="Bienvenue sur SmarterBloggers 🎉",
        html=_base(
            title="Bienvenue sur SmarterBloggers",
            preview=f"Bonjour {name} ! Votre compte SmarterBloggers est prêt.",
            body_html=body,
        ),
    )


# ─── Security & platform notifications ─────────────────────────────


async def send_login_notification(
    to: str,
    display_name: str,
    ip: str | None,
    timestamp: str,
) -> None:
    """Sent to a user each time they sign in successfully."""
    name = display_name or "there"
    ip_text = ip or "unknown"
    body = (
        _h1("New sign-in detected on your account") +
        _p(f"Hello <strong>{name}</strong>,") +
        _p("We detected a new sign-in to your SmarterBloggers account. If this was you, no action is needed.") +
        f'<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px 20px;margin:20px 0;">'
        f'<table cellpadding="0" cellspacing="0" width="100%">'
        f'<tr><td style="font-size:12px;color:{BRAND_MUTED};padding:5px 0;width:110px;">Date &amp; time</td>'
        f'<td style="font-size:13px;font-weight:600;color:{BRAND_DARK};">{timestamp}</td></tr>'
        f'<tr><td style="font-size:12px;color:{BRAND_MUTED};padding:5px 0;">IP address</td>'
        f'<td style="font-size:13px;font-weight:600;color:{BRAND_DARK};">{ip_text}</td></tr>'
        f'</table>'
        f'</div>' +
        f'<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px 16px;margin:16px 0;">'
        f'<p style="margin:0;font-size:13px;color:#991B1B;font-weight:600;">'
        f'If this wasn\'t you, secure your account immediately by changing your password and enabling 2FA.'
        f'</p>'
        f'</div>' +
        _note("This notification is sent automatically for every sign-in to keep your account secure. SmarterBloggers will never ask for your password.")
    )
    await _send(
        to=to,
        subject="New sign-in detected — SmarterBloggers",
        html=_base(
            title="Sign-in notification",
            preview=f"A new sign-in was detected from IP {ip_text}",
            body_html=body,
        ),
    )


async def send_domain_expiry_reminder(
    to: str,
    domain: str,
    expires_at: str,
) -> None:
    """Sent to a tenant owner when a purchased domain approaches expiry and
    auto-renew is off (crypto payments can't be auto-charged — the user must
    actively complete a renewal checkout)."""
    body = (
        _h1("Your domain is expiring soon") +
        _p(f"Your domain <strong>{domain}</strong> will expire on <strong>{expires_at}</strong>.") +
        _p("Renew it now from your Domains page to keep your blog reachable at this address.") +
        _note("Renewals are paid the same way as your subscription — no automatic charge is made without your action.")
    )
    await _send(
        to=to,
        subject=f"Action needed: {domain} expires soon — SmarterBloggers",
        html=_base(
            title="Domain expiry reminder",
            preview=f"{domain} expires on {expires_at}",
            body_html=body,
        ),
    )


async def send_superadmin_event(
    to: list[str],
    event_type: str,
    title: str,
    details: str,
    actor_email: str | None = None,
) -> None:
    """Sent to all super admins when a significant platform event occurs."""
    if not to:
        return

    color_map = {
        "user.register":     ("#10B981", "#F0FDF4", "#BBF7D0"),
        "payment.completed": ("#6366F1", "#EEF2FF", "#C7D2FE"),
        "ad.submitted":      ("#F59E0B", "#FFFBEB", "#FDE68A"),
        "article.published": ("#3B82F6", "#EFF6FF", "#BFDBFE"),
    }
    accent, bg, border = color_map.get(event_type, ("#6366F1", "#EEF2FF", "#C7D2FE"))

    actor_row = ""
    if actor_email:
        actor_row = (
            f'<tr><td style="font-size:12px;color:{BRAND_MUTED};padding:5px 0;width:90px;">Actor</td>'
            f'<td style="font-size:13px;font-weight:600;color:{BRAND_DARK};">{actor_email}</td></tr>'
        )

    body = (
        f'<div style="display:inline-block;background:{bg};border:1px solid {border};border-radius:6px;padding:4px 10px;margin-bottom:16px;">'
        f'<span style="font-size:11px;font-weight:700;color:{accent};text-transform:uppercase;letter-spacing:0.8px;">{event_type}</span>'
        f'</div>' +
        _h1(title) +
        f'<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-left:4px solid {accent};border-radius:8px;padding:14px 18px;margin:16px 0;">'
        f'<table cellpadding="0" cellspacing="0" width="100%">'
        + actor_row +
        f'<tr><td style="font-size:12px;color:{BRAND_MUTED};padding:5px 0;width:90px;">Details</td>'
        f'<td style="font-size:13px;color:{BRAND_DARK};">{details}</td></tr>'
        f'</table>'
        f'</div>' +
        _note("You receive this notification because you are a SmarterBloggers super administrator.")
    )
    await _send(
        to=to,
        subject=f"[SmarterBloggers] {title}",
        html=_base(
            title=f"Platform event: {event_type}",
            preview=title,
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
        f'<p style="margin:0;font-size:13px;color:#92400E;font-weight:600;">⚠️ Ne partagez jamais ces codes. SmarterBloggers ne vous les demandera jamais.</p>'
        f'</div>' +
        _note("Si vous n'avez pas activé la 2FA, contactez immédiatement notre support.")
    )
    await _send(
        to=to,
        subject="🔐 Vos codes de secours SmarterBloggers (2FA)",
        html=_base(
            title="Codes de secours 2FA",
            preview="Conservez ces codes en lieu sûr — ils vous permettent d'accéder à votre compte sans votre téléphone",
            body_html=body,
        ),
    )


async def send_affiliate_friend_invitation(
    to: str,
    sender_name: str,
    message_translated: str,
    referral_url: str,
    language: str = "en",
) -> None:
    """Email sent from a SmarterBloggers user to a friend, in the friend's language."""
    is_fr = language.lower().startswith("fr")
    if is_fr:
        subject_line = f"{sender_name} vous invite à découvrir SmarterBloggers"
        headline = f"{sender_name} pense à vous !"
        cta = "Découvrir SmarterBloggers"
        note_text = "Ce lien de parrainage vous offre un avantage exclusif à votre inscription."
    else:
        subject_line = f"{sender_name} invited you to try SmarterBloggers"
        headline = f"{sender_name} thought of you!"
        cta = "Discover SmarterBloggers"
        note_text = "This referral link gives you an exclusive benefit when you sign up."

    body = (
        _h1(headline) +
        f'<div style="background:#F0F9FF;border:1px solid #BAE6FD;border-left:4px solid {BRAND_BLUE};'
        f'border-radius:8px;padding:16px 20px;margin:20px 0;">'
        f'<p style="margin:0;font-size:15px;line-height:1.7;color:{BRAND_TEXT};font-style:italic;">'
        f'&ldquo;{message_translated}&rdquo;</p>'
        f'</div>' +
        _btn(cta, referral_url) +
        _divider() +
        _note(note_text)
    )
    await _send(
        to=to,
        subject=subject_line,
        html=_base(
            title="SmarterBloggers",
            preview=headline,
            body_html=body,
        ),
    )


async def send_affiliate_commission_notification(
    to: str,
    display_name: str,
    commission_amount: float,
    new_balance: float,
    source_type: str,
    level: int,
    dashboard_url: str,
) -> None:
    """Notifie un affilié qu'une commission vient d'être créditée sur son solde."""
    source_label = "abonnement SaaS" if source_type == "subscription" else "slot publicitaire"
    body = (
        _h1("Commission affilié créditée !") +
        _p(f"Bonjour <strong>{display_name}</strong>,") +
        _p(f"Bonne nouvelle ! Une commission de niveau {level} vient d'être créditée "
           f"sur votre compte affilié suite à un <strong>{source_label}</strong>.") +
        f'<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-left:4px solid #10B981;'
        f'border-radius:8px;padding:16px 20px;margin:20px 0;">'
        f'<table cellpadding="0" cellspacing="0" width="100%">'
        f'<tr>'
        f'<td style="font-size:13px;color:{BRAND_MUTED};width:150px;">Commission créditée</td>'
        f'<td style="font-size:18px;font-weight:800;color:#10B981;">+{commission_amount:.4f} USDT</td>'
        f'</tr>'
        f'<tr>'
        f'<td style="font-size:13px;color:{BRAND_MUTED};padding-top:8px;">Nouveau solde</td>'
        f'<td style="font-size:15px;font-weight:700;color:{BRAND_DARK};padding-top:8px;">{new_balance:.4f} USDT</td>'
        f'</tr>'
        f'</table>'
        f'</div>' +
        _btn("Voir mon tableau de bord affilié", dashboard_url, "#10B981") +
        _divider() +
        _note("Les commissions sont versées automatiquement sur votre wallet USDT TRC20 enregistré.")
    )
    await _send(
        to=to,
        subject=f"[SmarterBloggers] +{commission_amount:.4f} USDT crédité sur votre compte affilié",
        html=_base(
            title="Commission affilié créditée",
            preview=f"Vous venez de gagner {commission_amount:.4f} USDT en tant qu'affilié niveau {level}.",
            body_html=body,
        ),
    )
