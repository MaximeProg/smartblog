'use client';

export function NewsletterForm({ primaryColor }: { primaryColor?: string }) {
  return (
    <div className="rounded-xl p-5 text-white" style={{ background: 'var(--blog-primary)' }} id="newsletter">
      <h3 className="font-black text-lg mb-1">Newsletter</h3>
      <p className="text-white/80 text-sm mb-4">Recevez nos meilleurs articles chaque semaine.</p>
      <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
        <input
          type="email"
          placeholder="votre@email.com"
          className="px-3 py-2 rounded-lg text-gray-900 text-sm w-full focus:outline-none"
        />
        <button
          type="submit"
          className="bg-white font-bold text-sm py-2 rounded-lg hover:bg-white/90 transition-colors"
          style={{ color: 'var(--blog-primary)' }}
        >
          S&apos;abonner
        </button>
      </form>
    </div>
  );
}
