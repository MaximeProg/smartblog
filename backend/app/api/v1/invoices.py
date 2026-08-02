"""Système de facturation générique — pas spécifique au KYC (voir migration
065 et invoice_service.py). Premier utilisateur : le paiement de vérification
KYC, mais réutilisable pour d'autres types de paiement futurs sans migration."""
import uuid
from datetime import datetime

from fastapi import APIRouter, Response
from pydantic import BaseModel
from sqlalchemy import select

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException
from app.models.invoice import Invoice

router = APIRouter(prefix="/users/me/invoices", tags=["invoices"])


class InvoiceItem(BaseModel):
    id: str
    invoice_number: str
    payment_type: str
    amount: float
    currency: str
    payment_reference: str | None
    status: str
    created_at: datetime


def _invoice_item(inv: Invoice) -> InvoiceItem:
    return InvoiceItem(
        id=str(inv.id),
        invoice_number=inv.invoice_number,
        payment_type=inv.payment_type,
        amount=float(inv.amount),
        currency=inv.currency,
        payment_reference=inv.payment_reference,
        status=inv.status,
        created_at=inv.created_at,
    )


async def _get_own_invoice(db, user_id: uuid.UUID, invoice_id: str) -> Invoice:
    """Filtre systématique sur user_id == utilisateur connecté — un
    utilisateur ne peut jamais consulter/télécharger la facture d'un autre
    (même précédent que list_my_payments, payments.py)."""
    try:
        inv_uuid = uuid.UUID(invoice_id)
    except ValueError:
        raise NotFoundException("Invoice")
    result = await db.execute(
        select(Invoice).where(Invoice.id == inv_uuid, Invoice.user_id == user_id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise NotFoundException("Invoice")
    return invoice


@router.get("", response_model=list[InvoiceItem])
async def list_my_invoices(payload: TokenPayload, db: DBSession, limit: int = 50):
    user_id = uuid.UUID(payload["sub"])
    result = await db.execute(
        select(Invoice)
        .where(Invoice.user_id == user_id)
        .order_by(Invoice.created_at.desc())
        .limit(limit)
    )
    return [_invoice_item(inv) for inv in result.scalars().all()]


@router.get("/{invoice_id}", response_model=InvoiceItem)
async def get_my_invoice(invoice_id: str, payload: TokenPayload, db: DBSession):
    invoice = await _get_own_invoice(db, uuid.UUID(payload["sub"]), invoice_id)
    return _invoice_item(invoice)


@router.get("/{invoice_id}/download")
async def download_my_invoice(invoice_id: str, payload: TokenPayload, db: DBSession):
    """Régénère le PDF à la demande depuis le snapshot figé — jamais stocké
    en base, jamais recalculé depuis l'état courant de la transaction."""
    from app.services.invoice_service import render_invoice_pdf, _LABELS_EN
    from app.services.translation_service import translate_json

    invoice = await _get_own_invoice(db, uuid.UUID(payload["sub"]), invoice_id)
    labels = await translate_json(dict(_LABELS_EN), target_lang=invoice.language, source_lang="en")
    pdf_bytes = render_invoice_pdf(invoice, labels)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{invoice.invoice_number}.pdf"'},
    )
