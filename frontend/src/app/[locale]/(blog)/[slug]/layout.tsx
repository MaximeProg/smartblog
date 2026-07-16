interface Props {
  children: React.ReactNode;
}

// Toutes les pages de ce groupe redirigent vers /blog/[slug] (voir chaque
// page.tsx) — cette mise en page ne fait que transmettre les enfants, sans
// refaire l'appel réseau que la redirection rendrait de toute façon inutile.
export default function BlogSlugLayout({ children }: Props) {
  return <>{children}</>;
}
