// Public blog layout — no <html>/<body>, root layout owns those.
// Subdomain-routed blogs (/blog/[slug]/...) use this for route grouping only.
export default function BlogRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
