// Blog preview layout — no <html>/<body>, root layout owns those.
export default function BlogPreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
