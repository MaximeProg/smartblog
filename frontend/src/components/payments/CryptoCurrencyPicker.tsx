'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { paymentsApi, type PaymentCurrencyInfo } from '@/lib/api';

interface CryptoCurrencyPickerProps {
  tenantId: string;
  amountUsd: number;
  value: string;
  onChange: (code: string) => void;
  onValidityChange?: (valid: boolean) => void;
}

/**
 * Sélecteur de devise de paiement crypto, réutilisé par tous les flux
 * d'achat (pubs, domaines...). Liste récupérée en direct depuis NowPayments
 * (jamais figée côté plateforme). Le plancher minimum varie fortement selon
 * la devise choisie (confirmé le 2026-07-27 : ~0.05$ en usdtbsc, ~4$ en BTC)
 * — vérifié en direct à chaque changement de devise, pas pré-calculé pour
 * les ~300 devises à la fois (trop coûteux).
 */
export function CryptoCurrencyPicker({ tenantId, amountUsd, value, onChange, onValidityChange }: CryptoCurrencyPickerProps) {
  const t = useTranslations('cryptoPayment');
  const [search, setSearch] = useState('');

  const { data: currencies = [], isLoading } = useQuery({
    queryKey: ['payment-currencies', tenantId],
    queryFn: async () => { const { data } = await paymentsApi.getCurrencies(tenantId); return data; },
    staleTime: 60 * 60 * 1000,
  });

  const { data: minAmountData, isFetching: checkingMin } = useQuery({
    queryKey: ['payment-min-amount', tenantId, value],
    queryFn: async () => { const { data } = await paymentsApi.getMinAmount(tenantId, value); return data; },
    enabled: !!value,
    staleTime: 60 * 1000,
  });

  const minAmount = minAmountData?.min_amount_usd ?? 0;
  const belowMin = !!minAmountData && minAmountData.currency === value && amountUsd > 0 && amountUsd < minAmount;
  const valid = !!value && !checkingMin && !belowMin;

  useEffect(() => { onValidityChange?.(valid); }, [valid, onValidityChange]);

  const filtered = currencies.filter((c: PaymentCurrencyInfo) =>
    !search || c.code.includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">{t('currencyPickerLabel')}</label>
      {isLoading ? (
        <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[12.5px] text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('currencyPickerLoading')}
        </div>
      ) : (
        <>
          <div className="relative mb-1.5">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('currencyPickerSearch')}
              className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[12px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.slice(0, 100).map((c: PaymentCurrencyInfo) => (
              <button
                key={c.code}
                type="button"
                onClick={() => onChange(c.code)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-[12.5px] transition-colors ${
                  value === c.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{c.name}</span>
                <span className="text-[10px] uppercase text-slate-400">{c.code}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2.5 text-[12px] text-slate-400">{t('currencyPickerNoResults')}</p>
            )}
          </div>
        </>
      )}

      {value && checkingMin && (
        <p className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
          <Loader2 className="h-3 w-3 animate-spin" /> {t('minAmountChecking')}
        </p>
      )}
      {value && belowMin && (
        <p className="flex items-center gap-1.5 text-[11px] text-red-500 mt-1.5">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {t('minAmountTooLow', { currency: value.toUpperCase(), amount: minAmount.toFixed(2) })}
        </p>
      )}
    </div>
  );
}
