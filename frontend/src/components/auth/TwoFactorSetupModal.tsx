'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, ShieldCheck, Copy, Check, X, ChevronRight, KeyRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { twoFactorApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

/** Corrige le SVG produit par qrcode[SvgImage] qui préfixe les éléments avec svg: */
function cleanSvg(raw: string): string {
  return raw
    .replace(/<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" style="display:block">')
    .replace(/<svg:/g, '<')
    .replace(/<\/svg:/g, '</');
}

interface Props {
  onClose: () => void;
  onEnabled: () => void;
}

type Step = 'qr' | 'verify' | 'backup';

export function TwoFactorSetupModal({ onClose, onEnabled }: Props) {
  const t = useTranslations('twoFA');
  const { toast } = useToast();

  const [step, setStep]           = useState<Step>('qr');
  const [qrSvg, setQrSvg]         = useState('');
  const [uri, setUri]              = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode]            = useState('');
  const [copied, setCopied]        = useState(false);
  const [copiedAll, setCopiedAll]  = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupError, setSetupError]     = useState(false);

  // Fetch QR on mount. The `cancelled` flag handles React StrictMode double-invoke:
  // when Strict Mode unmounts+remounts, the first request's callbacks are ignored
  // and only the second request (from the real mount) updates state.
  useEffect(() => {
    let cancelled = false;
    twoFactorApi.setup()
      .then(({ data }) => {
        if (cancelled) return;
        setQrSvg(data.qr_code_svg);
        setUri(data.otpauth_uri);
        setBackupCodes(data.backup_codes);
        setSetupLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSetupError(true);
        setSetupLoading(false);
        toast({ variant: 'destructive', title: t('setupError') });
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Étape 2 : vérifie le premier code
  const enableMut = useMutation({
    mutationFn: () => twoFactorApi.enable(code.replace(/\s/g, '')),
    onSuccess: () => setStep('backup'),
    onError: () => toast({ variant: 'destructive', title: t('invalidCode') }),
  });

  function copyUri() {
    navigator.clipboard.writeText(uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  function handleCodeInput(raw: string) {
    // Accepte chiffres et espaces, max 7 chars (6 digits + 1 espace optionnel)
    const cleaned = raw.replace(/[^0-9 ]/g, '').slice(0, 7);
    setCode(cleaned);
  }

  function handleFinish() {
    onEnabled();
    onClose();
    toast({ title: t('enabledToast') });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-slate-900 dark:text-slate-100">{t('setupTitle')}</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {step === 'qr' && t('step1of3')}
                {step === 'verify' && t('step2of3')}
                {step === 'backup' && t('step3of3')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 px-6 pt-4">
          {(['qr','verify','backup'] as Step[]).map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
              s === step ? 'bg-blue-500' :
              (step === 'verify' && s === 'qr') || step === 'backup' ? 'bg-blue-200 dark:bg-blue-800' :
              'bg-slate-200 dark:bg-slate-700'
            }`} />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5">

          {/* ── Étape 1 : QR Code ─────────────────────── */}
          {step === 'qr' && (
            <div className="space-y-4">
              <p className="text-[13px] text-slate-600 dark:text-slate-400">{t('step1Desc')}</p>

              {setupLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : setupError ? (
                <div className="h-48 flex items-center justify-center text-sm text-destructive">
                  {t('setupError')}
                </div>
              ) : (
                <div
                  className="mx-auto bg-white rounded-xl border border-slate-200 p-3 overflow-hidden inline-block"
                  dangerouslySetInnerHTML={{ __html: cleanSvg(qrSvg) }}
                />
              )}

              {uri && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{t('manualEntry')}</p>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <KeyRound className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <code className="flex-1 text-[11px] text-slate-700 dark:text-slate-300 font-mono break-all leading-relaxed">
                      {/* Extract secret from URI: otpauth://totp/...?secret=XXXX&... */}
                      {new URLSearchParams(uri.split('?')[1] ?? '').get('secret') ?? uri}
                    </code>
                    <button onClick={copyUri} className="shrink-0 text-slate-400 hover:text-blue-500 transition-colors">
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('verify')}
                disabled={setupLoading || setupError}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold transition-colors disabled:opacity-50"
              >
                {t('nextButton')} <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── Étape 2 : Vérification ────────────────── */}
          {step === 'verify' && (
            <div className="space-y-4">
              <p className="text-[13px] text-slate-600 dark:text-slate-400">{t('step2Desc')}</p>

              <div>
                <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{t('codeLabel')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={e => handleCodeInput(e.target.value)}
                  placeholder="000 000"
                  maxLength={7}
                  autoFocus
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[22px] font-mono tracking-[0.3em] text-center text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('qr')}
                  className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('backButton')}
                </button>
                <button
                  onClick={() => enableMut.mutate()}
                  disabled={code.replace(/\s/g, '').length < 6 || enableMut.isPending}
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold transition-colors disabled:opacity-50"
                >
                  {enableMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {t('verifyButton')}
                </button>
              </div>
            </div>
          )}

          {/* ── Étape 3 : Backup codes ────────────────── */}
          {step === 'backup' && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2.5">
                <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[12px] text-amber-700 dark:text-amber-300">{t('backupWarning')}</p>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {backupCodes.map((c, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5 font-mono text-[12px] text-slate-700 dark:text-slate-300 text-center tracking-widest">
                    {c}
                  </div>
                ))}
              </div>

              <button
                onClick={copyBackupCodes}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {copiedAll ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedAll ? t('copiedButton') : t('copyBackupCodes')}
              </button>

              <button
                onClick={handleFinish}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white text-[13px] font-semibold transition-colors"
              >
                <ShieldCheck className="h-4 w-4" /> {t('doneButton')}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
