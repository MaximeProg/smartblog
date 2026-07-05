'use client';

import { useState, type CSSProperties } from 'react';
import type { BlogInfo, PublicCategory } from '@/lib/public-api';
import { CreativeHeader, CreativeFooter } from './CreativeShared';

interface Props {
  blog: BlogInfo;
  categories: PublicCategory[];
  basePath: string;
}

export default function CreativeAbout({ blog, categories, basePath }: Props) {
  const primaryColor = blog.primary_color || '#7c3aed';
  const [email, setEmail] = useState('');

  return (
    <div className="bg-white min-h-screen" style={{ '--cp': primaryColor } as CSSProperties}>
      <CreativeHeader blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />

      <section className="bg-zinc-950 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <span
            className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-8 inline-block text-zinc-950"
            style={{ backgroundColor: primaryColor }}
          >
            About
          </span>
          <h1 className="text-6xl sm:text-8xl font-black text-white leading-none mb-6">
            {blog.name}
          </h1>
          {blog.description && (
            <p className="text-zinc-400 text-xl max-w-2xl leading-relaxed">{blog.description}</p>
          )}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black text-zinc-950 mb-6">Our Vision</h2>
              <p className="text-lg text-zinc-600 leading-relaxed mb-6">
                We believe in the power of creative expression and the transformative potential of
                thoughtful content. Every piece published here is crafted with intention and passion.
              </p>
              <p className="text-lg text-zinc-600 leading-relaxed">
                Our platform brings together diverse perspectives, bold ideas, and visual storytelling
                to create a space where creativity thrives and inspires the next generation of makers.
              </p>
            </div>
            <div className="bg-zinc-950 rounded-2xl p-10">
              <div className="grid grid-cols-1 gap-0 divide-y divide-zinc-800">
                {[
                  { value: 'Est. 2024', label: 'Founded' },
                  { value: `${categories.length}`, label: 'Topics' },
                  { value: 'Growing', label: 'Community' },
                ].map((stat) => (
                  <div key={stat.label} className="py-6 first:pt-0 last:pb-0">
                    <p className="text-5xl font-black text-white mb-1">{stat.value}</p>
                    <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black text-zinc-950 mb-10">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                ),
                title: 'Bold Ideas',
                desc: 'We champion unconventional thinking and creative risk-taking in every piece of content we publish.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ),
                title: 'Visual First',
                desc: 'Imagery and aesthetics are at the heart of our storytelling, creating experiences that resonate deeply.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                ),
                title: 'Community',
                desc: 'We build connections between creators, thinkers, and readers who share a passion for meaningful content.',
              },
            ].map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-xl p-6 border-l-4 shadow-sm"
                style={{ borderLeftColor: primaryColor }}
              >
                <div className="mb-4" style={{ color: primaryColor }}>
                  {v.icon}
                </div>
                <h3 className="text-xl font-black text-zinc-950 mb-2">{v.title}</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-zinc-950 rounded-2xl px-8 sm:px-16 py-16 text-center">
          <p className="text-4xl font-black text-white mb-2">{blog.name}</p>
          <p className="text-zinc-400 text-base mb-8 max-w-md mx-auto">
            Join the creative community
          </p>
          <form
            className="flex max-w-sm mx-auto gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setEmail('');
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-[var(--cp)]"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl font-black text-sm text-zinc-950 hover:opacity-90 transition-opacity shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <CreativeFooter blog={blog} categories={categories} basePath={basePath} primaryColor={primaryColor} />
    </div>
  );
}
