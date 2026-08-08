/**
 * Le badge "Powered by SmarterBloggers" affiché sur chaque blog public
 * pointe vers le lien de parrainage du propriétaire du blog quand il en a
 * un — n'importe quel visiteur peut ainsi s'inscrire sur SmarterBloggers
 * en étant rattaché à ce blogueur, sans action supplémentaire de sa part.
 */
export function poweredByUrl(ownerAffiliateCode: string | null | undefined): string {
  return ownerAffiliateCode
    ? `https://smarterbloggers.com/register?ref=${ownerAffiliateCode}`
    : 'https://smarterbloggers.com';
}
