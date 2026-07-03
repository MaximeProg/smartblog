"""
Génère les pages et menus par défaut quand un blog est créé.

Chaque template produit :
  - Accueil (homepage, publié)
  - À propos (publié)
  - Contact (publié)
  - 404 (système, publié)
  - Menu "Principal" (primary) liant Accueil / Articles / À propos / Contact

Les blocs sont adaptés au style de chaque template.
"""
import uuid as uuid_mod
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.page import Page, PageStatus, PageType, Menu


def _now() -> datetime:
    return datetime.utcnow()


# ── Block factories ────────────────────────────────────────────────────────────

def _hero(
    title: str,
    subtitle: str,
    cta_text: str = "Lire les articles",
    cta_url: str = "/articles",
    layout: str = "split",       # full | split | minimal
    bg_color: str | None = None,
) -> dict:
    return {
        "id": str(uuid_mod.uuid4()),
        "type": "hero",
        "props": {
            "title": title,
            "subtitle": subtitle,
            "cta_text": cta_text,
            "cta_url": cta_url,
            "image_url": None,
            "layout": layout,
            "bg_color": bg_color,
            "text_align": "left" if layout == "split" else "center",
        },
    }


def _articles_grid(
    title: str = "Derniers articles",
    count: int = 6,
    columns: int = 3,
    show_featured: bool = False,
) -> dict:
    return {
        "id": str(uuid_mod.uuid4()),
        "type": "articles-grid",
        "props": {
            "title": title,
            "count": count,
            "columns": columns,
            "show_featured": show_featured,
            "show_category": True,
            "show_date": True,
            "show_excerpt": True,
        },
    }


def _newsletter(
    title: str = "Restez informé",
    description: str = "Recevez nos meilleurs articles directement dans votre boîte mail.",
    cta_text: str = "S'abonner",
    layout: str = "centered",    # centered | side-by-side
) -> dict:
    return {
        "id": str(uuid_mod.uuid4()),
        "type": "newsletter",
        "props": {
            "title": title,
            "description": description,
            "cta_text": cta_text,
            "placeholder": "votre@email.com",
            "layout": layout,
        },
    }


def _heading(text: str, level: str = "h2", alignment: str = "left") -> dict:
    return {
        "id": str(uuid_mod.uuid4()),
        "type": "heading",
        "props": {"text": text, "level": level, "alignment": alignment},
    }


def _paragraph(content: str, alignment: str = "left") -> dict:
    return {
        "id": str(uuid_mod.uuid4()),
        "type": "paragraph",
        "props": {"content": content, "alignment": alignment},
    }


# ── Per-template page definitions ──────────────────────────────────────────────

def _pages_for_template(template_id: str, blog_name: str) -> list[dict]:
    """Returns a list of page dicts with title, slug, blocks, page_type, is_homepage, status, sort_order."""

    t = template_id.lower()

    if t == "minimal":
        home_blocks = [
            _hero(
                f"Bienvenue sur {blog_name}",
                "Un espace de réflexion et de partage.",
                layout="minimal",
            ),
            _articles_grid("Articles récents", count=6, columns=3),
            _newsletter(),
        ]

    elif t == "magazine":
        home_blocks = [
            _hero(
                blog_name,
                "L'actualité qui compte, racontée avec passion.",
                layout="full",
                bg_color="#111827",
            ),
            _articles_grid("À la une", count=9, columns=3, show_featured=True),
            _newsletter("Newsletter", "Ne manquez aucun article.", layout="side-by-side"),
        ]

    elif t == "business":
        home_blocks = [
            _hero(
                f"{blog_name} — Expertise & Insights",
                "Des analyses approfondies pour les professionnels ambitieux.",
                cta_text="Découvrir nos articles",
                layout="split",
            ),
            _articles_grid("Nos dernières analyses", count=6, columns=3),
            _newsletter("Restez à la pointe", "Recevez nos insights chaque semaine."),
        ]

    elif t == "news":
        home_blocks = [
            _hero(
                "L'actualité en continu",
                "Toutes les dernières nouvelles, en temps réel.",
                layout="full",
                bg_color="#1e293b",
            ),
            _articles_grid("Dernières dépêches", count=9, columns=3, show_featured=True),
        ]

    elif t == "tech":
        home_blocks = [
            _hero(
                f"{blog_name}",
                "Code, design, et technologies du futur.",
                cta_text="Explorer les tutoriels",
                layout="split",
                bg_color="#0f172a",
            ),
            _articles_grid("Tutoriels & Articles", count=6, columns=3),
            _newsletter("Dev Newsletter", "Les meilleures ressources tech, chaque semaine."),
        ]

    elif t == "portfolio":
        home_blocks = [
            _hero(
                f"Je suis {blog_name}",
                "Créatif, passionné, et toujours en train de construire quelque chose.",
                cta_text="Voir mes projets",
                cta_url="/projets",
                layout="full",
            ),
            _articles_grid("Mes derniers projets", count=6, columns=3),
        ]

    else:
        home_blocks = [
            _hero(f"Bienvenue sur {blog_name}", "Découvrez nos articles.", layout="split"),
            _articles_grid(),
            _newsletter(),
        ]

    about_blocks = [
        _hero(
            f"À propos de {blog_name}",
            "Découvrez qui nous sommes et pourquoi nous écrivons.",
            cta_text="Lire nos articles",
            cta_url="/articles",
            layout="minimal",
        ),
        _heading("Notre histoire"),
        _paragraph(
            "<p>Parlez de vous ici — votre mission, votre équipe, vos valeurs. "
            "Cliquez sur ce bloc pour le modifier avec l'éditeur de site.</p>"
        ),
    ]

    contact_blocks = [
        _hero(
            "Contactez-nous",
            "Une question ? Une collaboration ? Écrivez-nous.",
            cta_text="",
            cta_url="",
            layout="minimal",
        ),
        _heading("Envoyez-nous un message"),
        _paragraph(
            "<p>Vous pouvez nous contacter à l'adresse suivante : "
            "<strong>contact@exemple.com</strong></p>"
        ),
    ]

    not_found_blocks = [
        _heading("404 — Page introuvable", level="h1", alignment="center"),
        _paragraph(
            "<p style=\"text-align:center\">La page que vous cherchez n'existe pas ou a été déplacée.</p>",
            alignment="center",
        ),
    ]

    now = _now()
    return [
        {
            "title": "Accueil",
            "slug": "",
            "is_homepage": True,
            "page_type": PageType.STANDARD,
            "status": PageStatus.PUBLISHED,
            "blocks": home_blocks,
            "sort_order": 0,
            "published_at": now,
        },
        {
            "title": "À propos",
            "slug": "a-propos",
            "is_homepage": False,
            "page_type": PageType.STANDARD,
            "status": PageStatus.PUBLISHED,
            "blocks": about_blocks,
            "sort_order": 1,
            "published_at": now,
        },
        {
            "title": "Contact",
            "slug": "contact",
            "is_homepage": False,
            "page_type": PageType.STANDARD,
            "status": PageStatus.PUBLISHED,
            "blocks": contact_blocks,
            "sort_order": 2,
            "published_at": now,
        },
        {
            "title": "Page introuvable",
            "slug": "404",
            "is_homepage": False,
            "page_type": PageType.SYSTEM,
            "status": PageStatus.PUBLISHED,
            "blocks": not_found_blocks,
            "sort_order": 99,
            "published_at": now,
        },
    ]


# ── Public entry point ─────────────────────────────────────────────────────────

async def seed_blog(
    db: AsyncSession,
    tenant_id: uuid_mod.UUID,
    blog_name: str,
    template_id: str,
) -> None:
    """Called once after a blog is created. Seeds pages + primary menu."""
    now = _now()
    page_defs = _pages_for_template(template_id, blog_name)

    created_pages: list[Page] = []
    for defn in page_defs:
        page = Page(
            tenant_id=tenant_id,
            title=defn["title"],
            slug=defn["slug"],
            status=defn["status"],
            page_type=defn["page_type"],
            is_homepage=defn["is_homepage"],
            blocks=defn["blocks"],
            sort_order=defn["sort_order"],
            published_at=defn.get("published_at"),
            created_at=now,
            updated_at=now,
        )
        db.add(page)
        created_pages.append(page)

    await db.flush()  # get page IDs

    # Build primary menu: Accueil / Articles / À propos / Contact
    home_page = next((p for p in created_pages if p.is_homepage), None)
    about_page = next((p for p in created_pages if p.slug == "a-propos"), None)
    contact_page = next((p for p in created_pages if p.slug == "contact"), None)

    menu_items = [
        {
            "id": str(uuid_mod.uuid4()),
            "label": "Accueil",
            "type": "page",
            "ref_id": str(home_page.id) if home_page else None,
            "url": "/",
            "open_new_tab": False,
            "children": [],
        },
        {
            "id": str(uuid_mod.uuid4()),
            "label": "Articles",
            "type": "dynamic",
            "ref_id": None,
            "url": "/articles",
            "open_new_tab": False,
            "children": [],
        },
        {
            "id": str(uuid_mod.uuid4()),
            "label": "À propos",
            "type": "page",
            "ref_id": str(about_page.id) if about_page else None,
            "url": "/a-propos",
            "open_new_tab": False,
            "children": [],
        },
        {
            "id": str(uuid_mod.uuid4()),
            "label": "Contact",
            "type": "page",
            "ref_id": str(contact_page.id) if contact_page else None,
            "url": "/contact",
            "open_new_tab": False,
            "children": [],
        },
    ]

    menu = Menu(
        tenant_id=tenant_id,
        name="Principal",
        location="primary",
        items=menu_items,
        created_at=now,
        updated_at=now,
    )
    db.add(menu)

    # Footer menu (lighter)
    footer_menu = Menu(
        tenant_id=tenant_id,
        name="Pied de page",
        location="footer",
        items=[
            {
                "id": str(uuid_mod.uuid4()),
                "label": "À propos",
                "type": "page",
                "ref_id": str(about_page.id) if about_page else None,
                "url": "/a-propos",
                "open_new_tab": False,
                "children": [],
            },
            {
                "id": str(uuid_mod.uuid4()),
                "label": "Contact",
                "type": "page",
                "ref_id": str(contact_page.id) if contact_page else None,
                "url": "/contact",
                "open_new_tab": False,
                "children": [],
            },
        ],
        created_at=now,
        updated_at=now,
    )
    db.add(footer_menu)

    await db.commit()
