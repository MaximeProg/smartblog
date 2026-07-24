# SmarterBloggers "Advertise" Module — Handoff for MH5 / DSM Integration

Prepared for Morice and Shakil to adapt this module into the MH5 and DSM codebases respectively, with a new affiliate commission structure specific to those two projects (different from what SmarterBloggers itself uses today).

---

## 1. What this module does (architecture overview)

The "Advertise" feature lets an anonymous advertiser buy an ad slot on a blog, pay in crypto (USDT BEP20 via NowPayments), and — once approved by a super admin — have their ad displayed on that blog. Revenue from the ad purchase is then split between the blog owner and the affiliate program.

Flow:
1. **Public submission** (no auth required) — advertiser fills a form with ad details (title, image, click URL, placement, budget, dates) and gets a crypto payment address/QR code directly on the page (no redirect).
2. **Payment confirmation** — once NowPayments confirms the crypto payment, the ad moves from `PAYMENT_PENDING` to `PENDING` (awaiting review). This is also the point where a security scan of the destination URL runs (Google Safe Browsing / VirusTotal / URLhaus) and super admins get notified.
3. **Super admin moderation** — a super admin reviews the ad (checks the link-safety scan result) and approves or rejects it. Approval is blocked if the link was flagged as dangerous.
4. **Revenue split** — on approval, if the ad was actually paid, revenue is split: a share to the blog owner (if they have a payout wallet configured), and a share to the affiliate program (see section 3).
5. **Live serving** — approved+active ads are displayed within the blog's theme (ad slot components), with impression/click tracking.

## 2. Relevant files (SmarterBloggers repo, for reference — adapt to MH5/DSM's own architecture, don't copy verbatim if their stack differs)

**Backend (FastAPI/SQLAlchemy):**
- `app/models/ad.py` — `Ad`, `AdLinkScan`, `AdRevenueShare` models (schema)
- `app/models/enums.py` — `AdSubmissionStatus`, `AdCampaignStatus`, `LinkSafetyStatus`, `AdRevenueShareStatus`
- `app/api/v1/ads.py` — public submit endpoint, list (admin), moderation/review endpoint, security scan endpoint, impression/click tracking
- `app/api/v1/payments.py` — crypto checkout tie-in (`_create_crypto_transaction`, and the `AD_CAMPAIGN` branch inside `_finalize_transaction` where payment confirmation triggers the scan + admin notification + revenue split)
- `app/api/v1/affiliate.py` — `compute_and_accrue_commissions()` — **this is the function whose logic needs replacing** with the new commission structure below
- Migrations: `005_social_ads.py`, `018_ad_payment_link.py` (DB schema — for reference on table shape, not meant to be run as-is in another project's DB)

**Frontend (Next.js):**
- `src/components/themes/shared/AdvertiseForm.tsx` — the public submission form + embedded crypto payment panel
- `src/components/themes/shared/AdvertisePage.tsx` — page wrapper
- `src/app/[locale]/(blog)/[slug]/advertise/page.tsx` — public route
- `src/app/[locale]/(dashboard)/blogs/[blogId]/ads/page.tsx` — blog owner's ad management dashboard
- `src/app/[locale]/(dashboard)/superadmin/ads/page.tsx` — super admin moderation UI
- Per-theme shared components (`themes/{corporate,creative,editorial,luminary,magazine}/*Shared.tsx`) — where ad slots actually render inside each visual theme

## 3. New commission structure for MH5 / DSM (per PDG instruction, 2026-07-23)

**This is NOT what SmarterBloggers itself currently uses.** SmarterBloggers' own `compute_and_accrue_commissions()` uses a 10%-of-ad-revenue pool split 50/50 between Level 1 and Levels 2-10 combined (i.e., 5% L1, ~0.56% each L2-10, no Founding Members pool). The structure below is a **different, new specification for MH5 and DSM only**:

| Recipient | Share of ad slot purchase price |
|---|---|
| Direct sponsor (Level 1) | **10%** |
| Indirect sponsors, each of Levels 2–10 (9 levels) | **1% each** (9% total) |
| Founding Members' pool | **10%** (accumulated, distributed monthly) |
| **Total to affiliate/founding distribution** | **29%** of ad slot purchase price |

Implementation notes:
- This mirrors the existing 10-level closure-table structure already used for the affiliate program (`AffiliateRelationship`, levels 1–10) — the same ancestor-lookup pattern in `compute_and_accrue_commissions()` can be reused, just with flat fixed percentages per level instead of SmarterBloggers' pool-based 50/50 split:
  - Level 1: 10%
  - Level 2 through Level 10: 1% each (flat, not derived from a shared pool)
  - No "missing levels go to the platform" pool-remainder logic needed here — each level's percentage is fixed and independent.
- **Founding Members' pool — needs clarification from the PDG before implementation:**
  - Who qualifies as a "Founding Member"? (a fixed list, first N users, users who joined before a cutoff date, etc.)
  - How is the monthly pool split among them — equally, or pro-rata by some activity/tenure metric?
  - This detail was not specified in the instruction and should be confirmed before Morice/Shakil build this part.
- **The remaining 71%** of the ad slot purchase price (100% − 29%) is not addressed by this instruction — presumably follows MH5/DSM's own existing revenue split rules for ad slots (e.g., blog owner share, platform share) already in place in each of those projects, separate from this affiliate/founding-pool carve-out.

## 4. Payment integration note

Both MH5 and DSM should already have their own NowPayments integration (MH5's was reviewed earlier this session — a separate `nowpayments_service.py`/`Deposit` model, different from SmarterBloggers'). The ad purchase payment flow (crypto checkout → confirmation → revenue split trigger) should plug into whatever payment confirmation mechanism already exists in each project, following the same principle SmarterBloggers uses: **never finalize/scan/notify/split revenue until payment is actually confirmed** — a lesson learned the hard way this session (see: an earlier bug where the security scan and admin notification fired at raw submission time, before payment, wasting resources on abandoned/unpaid submissions).
