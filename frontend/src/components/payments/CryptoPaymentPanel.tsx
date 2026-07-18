'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Copy, Loader2, XCircle, RefreshCw } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { paymentsApi } from '@/lib/api';

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
  open, onOpenChange, tenantId, orderId, payAddress, payAmount, payCurrency,
  qrCodeDataUri, expiresAt, amountUsd, onConfirmed, onRetry,
}: CryptoPaymentPanelProps) {
  const [copied, setCopied] = useState(false);
  const countdown = useCountdown(expiresAt);

  const { data } = useQuery({
    queryKey: ['payment-status', tenantId, orderId],
    queryFn: () => paymentsApi.getPaymentStatus(tenantId, orderId).then((r) => r.data),
    enabled: open,
    refetchInterval: (query) => (TERMINAL_STATUSES.has(query.state.data?.status ?? '') ? false : 5000),
    retry: false,
  });

  const status = data?.status ?? 'pending';
  const providerStatus = data?.provider_status ?? null;

  useEffect(() => {
    if (status === 'completed') onConfirmed();
  }, [status, onConfirmed]);

  function handleCopy() {
    navigator.clipboard.writeText(payAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
          {qrCodeDataUri && (
            <img
              src={qrCodeDataUri}
              alt="Payment QR code"
              className="h-48 w-48 rounded-xl border border-slate-200 dark:border-slate-700"
            />
          )}

          <div className="text-center">
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {payAmount} <span className="text-sm font-semibold text-slate-400">{payCurrency.toUpperCase()}</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">≈ ${amountUsd.toFixed(2)} USD</p>
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
              <span className="flex-1 text-xs font-mono truncate text-slate-700 dark:text-slate-300">{payAddress}</span>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
