"""067 — Compte de passif pour la part reversée aux propriétaires de blog
sur les articles/newsletters payants (2026-08-04)

Contexte : book_paid_article_payment/book_paid_newsletter_payment
(accounting.py) enregistrent désormais ces paiements, qui étaient jusqu'ici
totalement absents du grand livre. Contrairement aux pubs (AdRevenueShare +
versement crypto immédiat), il n'existe aujourd'hui AUCUN mécanisme de
versement de la part du propriétaire de blog sur un article/newsletter
payant — les 95% restants (après la commission plateforme de 5%,
comptes 4202/4203 déjà seedés en 014_accounting.py) doivent donc être
comptabilisés comme un passif dû, pas comme un revenu déjà distribué
(contrairement à 4102 pour les pubs, dont le versement est simultané).

Revision ID: 067
Revises: 066
Create Date: 2026-08-04
"""
from alembic import op

revision = "067"
down_revision = "066"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO chart_of_accounts (code, name, account_class, account_type, parent_code, is_system)
        VALUES ('2004', 'Content Revenue Payable to Blog Owners', 2, 'liability', '2000', true)
        ON CONFLICT (code) DO NOTHING
    """)


def downgrade() -> None:
    op.execute("DELETE FROM chart_of_accounts WHERE code = '2004'")
