'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Loader2, Receipt, Download } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { TopBar } from '@/components/dashboard/TopBar';
import { invoicesApi, type Invoice } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function InvoicesPage() {
  const t = useTranslations('invoices');
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['my-invoices'],
    queryFn: async () => { const { data } = await invoicesApi.list(); return data; },
  });

  async function handleDownload(inv: Invoice) {
    setDownloadingId(inv.id);
    try {
      const { data } = await invoicesApi.download(inv.id);
      const url = URL.createObjectURL(data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: 'destructive', title: t('downloadError') });
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8">
            <div className="mb-6">
              <h2 className="text-[20px] font-black text-slate-900 dark:text-slate-100">{t('title')}</h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{t('subtitle')}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <Receipt className="h-8 w-8 text-slate-300" />
                  <p className="text-[13px] text-slate-400">{t('empty')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        {[t('colNumber'), t('colType'), t('colAmount'), t('colDate'), t('colReference'), t('colStatus'), ''].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-100">{inv.invoice_number}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{t(`type.${inv.payment_type}` as any)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{inv.amount.toFixed(2)} {inv.currency}</td>
                          <td className="px-4 py-3 text-slate-400 dark:text-slate-500">
                            {new Date(inv.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-slate-400 dark:text-slate-500 font-mono text-xs truncate max-w-[160px]">{inv.payment_reference ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 capitalize">
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDownload(inv)}
                              disabled={downloadingId === inv.id}
                              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-[12px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                            >
                              {downloadingId === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                              {t('download')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
