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
    "pdf_reference": "Payment reference",
    "pdf_status": "Status",
    "pdf_status_issued": "Issued",
    "pdf_thank_you": "Thank you for your payment.",
    # Libellés par type de paiement (clé = Transaction.transaction_type.value)
    "payment_type_kyc_verification": "KYC Identity Verification",
}


async def _get_next_invoice_number(db) -> str:
    result = await db.execute(text("SELECT nextval('invoice_number_seq')"))
    n = result.scalar_one()
    return f"INV-{date.today().year}-{n:05d}"


def render_invoice_pdf(invoice: Invoice, labels: dict[str, str]) -> bytes:
    """Rend le PDF de la facture à partir de son snapshot figé — jamais
    recalculé depuis l'état courant de la transaction/l'utilisateur."""
    from fpdf import FPDF

    snap = invoice.snapshot
    pdf = FPDF(format="A4")
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 12, labels.get("pdf_invoice_title", "INVOICE"), new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(71, 85, 105)
    pdf.cell(0, 8, "SmarterBloggers", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    def row(label: str, value: str) -> None:
        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(148, 163, 184)
        pdf.cell(55, 8, label, new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 8, value, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)

    row(labels.get("pdf_invoice_number", "Invoice number"), snap["invoice_number"])
    row(labels.get("pdf_date", "Date"), snap["issued_date"])
    row(labels.get("pdf_billed_to", "Billed to"), snap["user_email"])
    row(labels.get("pdf_description", "Description"), snap["payment_type_label"])
    row(labels.get("pdf_amount", "Amount"), f"{snap['amount']:.2f} {snap['currency']}")
    if snap.get("payment_reference"):
        row(labels.get("pdf_reference", "Payment reference"), snap["payment_reference"])
    row(labels.get("pdf_status", "Status"), labels.get("pdf_status_issued", "Issued"))

    pdf.ln(8)
    pdf.set_font("Helvetica", "I", 10)
    pdf.set_text_color(148, 163, 184)
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
