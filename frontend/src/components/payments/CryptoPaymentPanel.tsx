'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Loader2, XCircle, RefreshCw } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { paymentsApi, type PaymentStatusResponse, type CryptoPaymentResponse } from '@/lib/api';

const TERMINAL_STATUSES = new Set(['completed', 'failed']);

const PROVIDER_STATUS_LABELS: Record<string, string> = {
  waiting: 'Waiting for payment…',
  confirming: 'Payment detected — confirming on-chain…',
  confirmed: 'Confirmed — finalizing…',
  sending: 'Finalizing…',
  partially_paid: 'Partial payment received — waiting for the rest…',
  finished: 'Payment complete!',
  failed: 'Payment failed.',
  expired: 'Payment window expired.',
};

interface CryptoPaymentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  transactionId: string;
  orderId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  qrCodeDataUri: string;
  expiresAt: string | null;
  amountUsd: number;
  onConfirmed: () => void;
  onRetry?: () => void;
}

function useCountdown(expiresAt: string | null) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();

    function tick() {
      const remaining = target - Date.now();
      if (remaining <= 0) {
        setLabel('expired');
        return;
      }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setLabel(`${m}:${s.toString().padStart(2, '0')}`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return label;
}

export function CryptoPaymentPanel({
  open, onOpenChange, tenantId, transactionId, orderId, payAddress, payAmount, payCurrency,
  qrCodeDataUri, expiresAt, amountUsd, onConfirmed, onRetry,
}: CryptoPaymentPanelProps) {
  const [copied, setCopied] = useState(false);

  // "Reprendre" ne crée rien côté NowPayments — la même adresse de dépôt
  // reste valable (NowPayments détecte lui-même les dépôts complémentaires
  // sur une adresse déjà utilisée). On rappelle juste l'API pour repasser
  // en vue "en attente" avec un solde restant à jour, sans dépendre d'un
  // nouveau rendu du parent.
  const [resumed, setResumed] = useState<CryptoPaymentResponse | null>(null);
  const [resuming, setResuming] = useState(false);
  useEffect(() => { setResumed(null); }, [orderId]);

  const eff = resumed ?? {
    order_id: orderId, pay_address: payAddress, pay_amount: payAmount,
    pay_currency: payCurrency, qr_code_data_uri: qrCodeDataUri,
    expires_at: expiresAt, amount_usd: amountUsd,
  };
  const countdown = useCountdown(eff.expires_at);

  // Polling manuel (pas de dépendance à react-query) — ce panneau est aussi
  // monté sur des pages publiques du blog (ex: formulaire "Advertise") qui
  // n'ont pas de QueryClientProvider dans leur arbre React.
  const [data, setData] = useState<PaymentStatusResponse | undefined>(undefined);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const { data: result } = await paymentsApi.getPaymentStatus(tenantId, eff.order_id);
        if (cancelled) return;
        setData(result);
        if (!TERMINAL_STATUSES.has(result.status)) {
          timer = setTimeout(poll, 5000);
        }
      } catch {
        if (!cancelled && !TERMINAL_STATUSES.has(dataRef.current?.status ?? '')) {
          timer = setTimeout(poll, 5000);
        }
      }
    }

    poll();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [open, tenantId, eff.order_id]);

  const status = data?.status ?? 'pending';
  const providerStatus = data?.provider_status ?? null;
  const remaining = Math.max(0, (data?.amount_due ?? eff.amount_usd) - (data?.amount_received ?? 0));

  useEffect(() => {
    if (status === 'completed') onConfirmed();
  }, [status, onConfirmed]);

  function handleCopy() {
    navigator.clipboard.writeText(eff.pay_address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleResume() {
    setResuming(true);
    try {
      const { data: result } = await paymentsApi.resumePayment(tenantId, transactionId, eff.order_id);
      setResumed(result);
      setData(undefined);
    } catch {
      // L'utilisateur peut réessayer — le bouton reste affiché.
    } finally {
      setResuming(false);
    }
  }

  if (status === 'failed') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center text-center py-4 gap-3">
            <XCircle className="h-10 w-10 text-red-500" />
            <p className="font-bold text-slate-900 dark:text-slate-100">
              {PROVIDER_STATUS_LABELS[providerStatus ?? 'failed'] ?? 'Payment failed.'}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Pay with crypto (USDT)</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {status === 'partially_paid' ? (
            <div className="flex flex-col items-center text-center gap-3 w-full">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold">
                {PROVIDER_STATUS_LABELS.partially_paid}
              </p>
              <p className="text-xs text-slate-400">
                Remaining: <span className="font-bold text-slate-700 dark:text-slate-300">${remaining.toFixed(2)} USD</span>
              </p>
              <button
                type="button"
                onClick={handleResume}
                disabled={resuming}
                className="flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50"
              >
                {resuming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Complete payment
              </button>
            </div>
          ) : (
            <>
              {eff.qr_code_data_uri && (
                <img
                  src={eff.qr_code_data_uri}
                  alt="Payment QR code"
                  className="h-48 w-48 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              )}

              <div className="text-center">
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {eff.pay_amount} <span className="text-sm font-semibold text-slate-400">{eff.pay_currency.toUpperCase()}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">≈ ${eff.amount_usd.toFixed(2)} USD</p>
              </div>

              <div className="w-full">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Deposit address
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2 px-3 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-left"
                >
                  <span className="flex-1 text-xs font-mono truncate text-slate-700 dark:text-slate-300">{eff.pay_address}</span>
                  {copied ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <Copy className="h-4 w-4 text-slate-400 shrink-0" />}
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {PROVIDER_STATUS_LABELS[providerStatus ?? 'waiting'] ?? 'Waiting for payment…'}
              </div>

              {countdown && (
                <p className="text-[11px] text-slate-400">
                  {countdown === 'expired' ? 'Payment window expired' : `Expires in ${countdown}`}
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
