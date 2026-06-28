import Image from 'next/image';
import { ReactNode } from 'react';

interface PageHeroProps {
  image: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PageHero({ image, title, subtitle, children }: PageHeroProps) {
  return (
    <section className="relative pt-28 sm:pt-32 md:pt-40 pb-14 md:pb-24 lg:pb-28 overflow-hidden">
      <Image
        src={image}
        alt=""
        fill
        className="object-cover"
        priority
        quality={90}
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/70 to-slate-950/90" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 md:mb-5 leading-tight max-w-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed">{subtitle}</p>
        )}
        {children}
      </div>
    </section>
  );
}
