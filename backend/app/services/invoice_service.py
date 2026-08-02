"""
Service de facturation — générique (pas spécifique au KYC), voir migration
065 et app/models/invoice.py. Premier appelant : le paiement de
vérification KYC (payments.py::_finalize_transaction), mais le format est
volontairement réutilisable pour d'autres types de paiement futurs.

Règle de traduction (décision PDG 2026-08-01) : la facture est générée par
défaut en anglais, puis traduite dans la langue de l'utilisateur via
l'intégration DeepL déjà existante (translation_service.py::translate_json,
qui retombe automatiquement sur l'anglais en cas d'échec/langue non
supportée). Seuls les LIBELLÉS (`_LABELS_EN` ci-dessous) passent par DeepL —
les données structurées (montant, devise, dates, numéro de facture,
référence de transaction) sont toujours prises telles quelles depuis le
`snapshot`, jamais retraduites ni reformattées après coup.
"""
from __future__ import annotations

import logging
from datetime import date

from sqlalchemy import text

from app.core.config import settings
from app.models.invoice import Invoice
from app.services import email_service
from app.services.translation_service import translate_json

logger = logging.getLogger(__name__)

# Libellés anglais par défaut — traduits via DeepL selon la langue de
# l'utilisateur (voir translate_json). Ne jamais y placer de valeur
# structurée (montant, date, numéro, référence) : ces libellés sont du
# texte pur, sans interpolation, pour ne courir aucun risque que DeepL
# modifie un identifiant ou un chiffre.
_LABELS_EN: dict[str, str] = {
    "subject": "Your invoice",
    "title": "Your invoice",
    "greeting": "Hello",
    "intro": "Here is your invoice for:",
    "invoice_number_label": "Invoice number",
    "amount_label": "Amount",
    "cta": "View my invoice",
    "footer": "Find all your invoices anytime in Dashboard → Invoices.",
    "pdf_invoice_title": "INVOICE",
    "pdf_invoice_number": "Invoice number",
    "pdf_date": "Date",
    "pdf_billed_to": "Billed to",
    "pdf_description": "Description",
    "pdf_amount": "Amount",
    "pdf_total": "Total",
    "pdf_reference": "Payment reference",
    "pdf_status": "Status",
    "pdf_status_paid": "Paid",
    "pdf_thank_you": "Thank you for your payment.",
    # Libellés par type de paiement (clé = Transaction.transaction_type.value)
    "payment_type_kyc_verification": "KYC Identity Verification",
}


async def _get_next_invoice_number(db) -> str:
    result = await db.execute(text("SELECT nextval('invoice_number_seq')"))
    n = result.scalar_one()
    return f"INV-{date.today().year}-{n:05d}"


_PDF_DARK = (15, 23, 42)
_PDF_TEXT = (71, 85, 105)
_PDF_MUTED = (148, 163, 184)
_PDF_GREEN = (5, 150, 105)
_PDF_HEADER_FILL = (241, 245, 249)
_PDF_LEFT_COL_X = 20
_PDF_RIGHT_COL_X = 120
_PDF_COL_WIDTH = 70


def render_invoice_pdf(invoice: Invoice, labels: dict[str, str]) -> bytes:
    """Rend le PDF de la facture à partir de son snapshot figé — jamais
    recalculé depuis l'état courant de la transaction/l'utilisateur.
    Mise en page à deux colonnes (émetteur à gauche / méta-facture à
    droite) + tableau pour le détail, plutôt qu'une simple liste verticale
    de libellé/valeur — plus lisible pour un document destiné à être
    imprimé/archivé par l'utilisateur."""
    from fpdf import FPDF
    from fpdf.fonts import FontFace

    snap = invoice.snapshot
    pdf = FPDF(format="A4")
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.set_margins(_PDF_LEFT_COL_X, 20, _PDF_LEFT_COL_X)
    pdf.add_page()

    # ── En-tête : émetteur à gauche, méta-facture à droite ──
    top_y = pdf.get_y()
    pdf.set_xy(_PDF_LEFT_COL_X, top_y)
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(*_PDF_DARK)
    pdf.cell(_PDF_COL_WIDTH, 8, "SmarterBloggers", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(_PDF_LEFT_COL_X)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*_PDF_MUTED)
    pdf.cell(_PDF_COL_WIDTH, 5, "smarterbloggers.com", new_x="LMARGIN", new_y="NEXT")

    pdf.set_xy(_PDF_RIGHT_COL_X, top_y)
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*_PDF_DARK)
    pdf.cell(_PDF_COL_WIDTH, 8, labels.get("pdf_invoice_title", "INVOICE"), align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(_PDF_RIGHT_COL_X)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*_PDF_TEXT)
    pdf.cell(_PDF_COL_WIDTH, 6, f"{labels.get('pdf_invoice_number', 'Invoice number')}: {snap['invoice_number']}", align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(_PDF_RIGHT_COL_X)
    pdf.cell(_PDF_COL_WIDTH, 6, f"{labels.get('pdf_date', 'Date')}: {snap['issued_date']}", align="R", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)
    pdf.set_draw_color(226, 232, 240)
    pdf.line(_PDF_LEFT_COL_X, pdf.get_y(), _PDF_RIGHT_COL_X + _PDF_COL_WIDTH, pdf.get_y())
    pdf.ln(8)

    # ── Facturé à (gauche) + statut (droite) ──
    mid_y = pdf.get_y()
    pdf.set_xy(_PDF_LEFT_COL_X, mid_y)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*_PDF_MUTED)
    pdf.cell(_PDF_COL_WIDTH, 5, labels.get("pdf_billed_to", "Billed to").upper(), new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(_PDF_LEFT_COL_X)
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*_PDF_DARK)
    pdf.cell(_PDF_COL_WIDTH, 6, snap["user_display_name"], new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(_PDF_LEFT_COL_X)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*_PDF_TEXT)
    pdf.cell(_PDF_COL_WIDTH, 6, snap["user_email"], new_x="LMARGIN", new_y="NEXT")

    pdf.set_xy(_PDF_RIGHT_COL_X, mid_y)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*_PDF_MUTED)
    pdf.cell(_PDF_COL_WIDTH, 5, labels.get("pdf_status", "Status").upper(), align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(_PDF_RIGHT_COL_X)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(*_PDF_GREEN)
    # Une facture n'est générée qu'après confirmation du paiement (voir
    # payments.py::_finalize_transaction) — son existence même signifie que
    # le paiement a réussi, d'où "Paid" toujours affiché ici (le statut
    # "issued"/"void" de l'enregistrement lui-même est un détail comptable
    # interne, pas ce que l'utilisateur a besoin de lire).
    pdf.cell(_PDF_COL_WIDTH, 7, labels.get("pdf_status_paid", "Paid"), align="R", new_x="LMARGIN", new_y="NEXT")
    if snap.get("payment_reference"):
        pdf.set_x(_PDF_RIGHT_COL_X)
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(*_PDF_MUTED)
        pdf.cell(_PDF_COL_WIDTH, 5, snap["payment_reference"], align="R", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(12)

    # ── Détail (tableau) ──
    amount_str = f"{snap['amount']:.2f} {snap['currency']}"
    with pdf.table(
        col_widths=(2, 1),
        text_align=("LEFT", "RIGHT"),
        headings_style=FontFace(emphasis="B", fill_color=_PDF_HEADER_FILL, color=_PDF_TEXT),
        line_height=7,
        borders_layout="MINIMAL",
    ) as table:
        header = table.row()
        header.cell(labels.get("pdf_description", "Description"))
        header.cell(labels.get("pdf_amount", "Amount"))

        data = table.row()
        data.cell(snap["payment_type_label"])
        data.cell(amount_str)

        total = table.row()
        total.cell(labels.get("pdf_total", "Total"), style=FontFace(emphasis="B"))
        total.cell(amount_str, style=FontFace(emphasis="B"))

    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 10)
    pdf.set_text_color(*_PDF_MUTED)
    pdf.cell(0, 8, labels.get("pdf_thank_you", "Thank you for your payment."), new_x="LMARGIN", new_y="NEXT")

    return bytes(pdf.output())


async def generate_and_send_invoice(
    db,
    *,
    user,
    transaction,
    payment_type: str,
    language: str = "en",
) -> Invoice:
    """Génère la facture d'un paiement, l'enregistre (Dashboard → Factures)
    et l'envoie par email. La création de la ligne `Invoice` est la partie
    qui doit réussir (l'utilisateur doit toujours la retrouver dans son
    Dashboard même si Resend est en panne) ; l'envoi de l'email est protégé
    par son propre try/except pour ne jamais faire échouer la facturation
    elle-même. Cette fonction, elle, n'attrape PAS ses propres erreurs :
    l'appelant (payments.py::_finalize_transaction) l'enveloppe pour ne
    jamais faire échouer la finalisation du paiement à cause de la facture."""
    invoice_number = await _get_next_invoice_number(db)
    payment_reference = (
        transaction.nowpayments_payment_id
        or transaction.nowpayments_order_id
        or str(transaction.id)
    )
    payment_type_key = f"payment_type_{payment_type}"
    payment_type_label_en = _LABELS_EN.get(payment_type_key, payment_type.replace("_", " ").title())

    snapshot = {
        "invoice_number": invoice_number,
        "issued_date": date.today().isoformat(),
        "user_id": str(user.id),
        "user_email": user.email,
        "user_display_name": user.display_name or user.email,
        "payment_type": payment_type,
        "payment_type_label": payment_type_label_en,
        "amount": float(transaction.amount),
        "currency": transaction.currency,
        "payment_reference": payment_reference,
        "transaction_id": str(transaction.id),
        "status": "issued",
    }

    invoice = Invoice(
        invoice_number=invoice_number,
        user_id=user.id,
        transaction_id=transaction.id,
        payment_type=payment_type,
        amount=transaction.amount,
        currency=transaction.currency,
        payment_reference=payment_reference,
        status="issued",
        language=language,
        snapshot=snapshot,
    )
    db.add(invoice)
    await db.flush()

    labels = await translate_json(dict(_LABELS_EN), target_lang=language, source_lang="en")
    payment_type_label = labels.get(payment_type_key, payment_type_label_en)

    try:
        pdf_bytes = render_invoice_pdf(invoice, labels)
        await email_service.send_invoice_email(
            to=user.email,
            display_name=user.display_name or user.email,
            invoice_number=invoice_number,
            payment_type_label=payment_type_label,
            amount=float(transaction.amount),
            currency=transaction.currency,
            invoice_url=f"{settings.FRONTEND_URL}/invoices",
            pdf_bytes=pdf_bytes,
            labels=labels,
        )
    except Exception:
        logger.exception("invoice_service: failed to send invoice email for %s", invoice_number)

    return invoice
