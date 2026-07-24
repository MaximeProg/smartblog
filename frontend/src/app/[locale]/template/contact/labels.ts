export interface ContactLabels {
  heroTitleLine1: string; heroTitleHighlight: string; heroSubtitle: string;
  sendMessageHeading: string; requiredFieldsNote: string;
  successHeading: string; successMessage: string; sendAnotherButton: string;
  fullNameLabel: string; fullNamePlaceholder: string;
  emailLabel: string; emailPlaceholder: string;
  subjectLabel: string; subjectPlaceholder: string;
  subjectOption1: string; subjectOption2: string; subjectOption3: string; subjectOption4: string;
  subjectOption5: string; subjectOption6: string; subjectOption7: string;
  messageLabel: string; messagePlaceholder: string;
  newsletterCheckboxLabel: string;
  submitButton: string; submitLoading: string;
  privacyNote: string;
  directContactHeading: string; emailResponseNote: string;
  phoneLabel: string; phoneResponseNote: string;
  addressLabel: string; addressLine1: string; addressLine2: string;
  followUsHeading: string;
  responseTimeHeading: string; responseTime1Label: string; responseTime2Label: string; responseTime3Label: string;
  faqHeading: string; faqNotFoundText: string; faqHelpCenterLink: string;
  faq1Q: string; faq1A: string; faq2Q: string; faq2A: string; faq3Q: string; faq3A: string;
  faq4Q: string; faq4A: string; faq5Q: string; faq5A: string;
}

export const EN_CONTACT: ContactLabels = {
  heroTitleLine1: 'Got a question?', heroTitleHighlight: "Let's talk.",
  heroSubtitle: "Our team responds to every request within 2 business days. We're always happy to hear from our readers.",
  sendMessageHeading: 'Send a message', requiredFieldsNote: 'All fields marked * are required.',
  successHeading: 'Message sent!', successMessage: "Thank you for your message. Our team will get back to you within 2 business days.",
  sendAnotherButton: 'Send another message',
  fullNameLabel: 'Full name', fullNamePlaceholder: 'John Smith',
  emailLabel: 'Email', emailPlaceholder: 'john@example.com',
  subjectLabel: 'Subject', subjectPlaceholder: 'Select a subject…',
  subjectOption1: 'Editorial question', subjectOption2: 'Submit an article',
  subjectOption3: 'Partnership / advertising', subjectOption4: 'Report an error',
  subjectOption5: 'Premium subscription', subjectOption6: 'Technical issue', subjectOption7: 'Other',
  messageLabel: 'Message', messagePlaceholder: 'Describe your request in detail…',
  newsletterCheckboxLabel: 'I want to receive the SmarterBloggers Insights newsletter (1 email per week, unsubscribe with one click)',
  submitButton: 'Send message', submitLoading: 'Sending…',
  privacyNote: 'Your data is processed in accordance with our privacy policy. It is never sold to third parties.',
  directContactHeading: 'Reach us directly', emailResponseNote: 'Response within 2 business days',
  phoneLabel: 'Phone', phoneResponseNote: 'Mon–Fri, 9am–6pm (CET)',
  addressLabel: 'Address', addressLine1: '15 rue de Rivoli', addressLine2: '75001 Paris, France',
  followUsHeading: 'Follow us',
  responseTimeHeading: 'Response times', responseTime1Label: 'General questions', responseTime2Label: 'Partnerships', responseTime3Label: 'Technical emergencies',
  faqHeading: 'Frequently asked questions', faqNotFoundText: "Can't find your answer?", faqHelpCenterLink: 'Check out our help center',
  faq1Q: 'How can I submit an article to SmarterBloggers Insights?',
  faq1A: 'We welcome contributions from experts with at least 5 years of experience in their field. Send us a topic + outline + 2-3 references at contributors@smarterbloggers.com. Our editorial committee will respond within 5 business days.',
  faq2Q: 'Can I republish your articles on other media outlets?',
  faq2A: 'Our content is copyright protected. However, we allow partial republishing (up to 300 words) with clear attribution and a link to the original article. For full republishing, contact us to obtain a license.',
  faq3Q: 'How do I access Premium content?',
  faq3A: 'Premium articles are accessible via a monthly or annual subscription. You can subscribe from any Premium article page. The subscription gives you access to the entire Premium catalog + archives.',
  faq4Q: 'Do you offer partnerships or sponsored content?',
  faq4A: 'We work with a limited number of partners whose products and services are relevant to our audience. Any commercial content is clearly identified as such. Contact us via the form to discuss opportunities.',
  faq5Q: 'How do I report an error in an article?',
  faq5A: 'Accuracy is our priority. If you spot an inaccuracy, contact us specifying the article in question, the error identified, and your source. We verify and correct within 48h with a transparent correction note.',
};

export const FR_CONTACT: ContactLabels = {
  heroTitleLine1: 'Une question ?', heroTitleHighlight: 'Parlons-en.',
  heroSubtitle: 'Notre équipe répond à toutes les demandes sous 2 jours ouvrés. Nous sommes toujours heureux d\'échanger avec nos lecteurs.',
  sendMessageHeading: 'Envoyer un message', requiredFieldsNote: 'Tous les champs marqués * sont obligatoires.',
  successHeading: 'Message envoyé !', successMessage: 'Merci pour votre message. Notre équipe vous répondra sous 2 jours ouvrés.',
  sendAnotherButton: 'Envoyer un autre message',
  fullNameLabel: 'Nom complet', fullNamePlaceholder: 'Jean Dupont',
  emailLabel: 'Email', emailPlaceholder: 'jean@exemple.fr',
  subjectLabel: 'Sujet', subjectPlaceholder: 'Sélectionnez un sujet…',
  subjectOption1: 'Question éditoriale', subjectOption2: 'Proposer un article',
  subjectOption3: 'Partenariat / publicité', subjectOption4: 'Signaler une erreur',
  subjectOption5: 'Abonnement Premium', subjectOption6: 'Problème technique', subjectOption7: 'Autre',
  messageLabel: 'Message', messagePlaceholder: 'Décrivez votre demande en détail…',
  newsletterCheckboxLabel: 'Je souhaite recevoir la newsletter SmarterBloggers Insights (1 email par semaine, désinscription en 1 clic)',
  submitButton: 'Envoyer le message', submitLoading: 'Envoi en cours…',
  privacyNote: 'Vos données sont traitées conformément à notre politique de confidentialité. Elles ne sont jamais vendues à des tiers.',
  directContactHeading: 'Nous joindre directement', emailResponseNote: 'Réponse sous 2 jours ouvrés',
  phoneLabel: 'Téléphone', phoneResponseNote: 'Lun–Ven, 9h–18h (CET)',
  addressLabel: 'Adresse', addressLine1: '15 rue de Rivoli', addressLine2: '75001 Paris, France',
  followUsHeading: 'Nous suivre',
  responseTimeHeading: 'Temps de réponse', responseTime1Label: 'Questions générales', responseTime2Label: 'Partenariats', responseTime3Label: 'Urgences techniques',
  faqHeading: 'Questions fréquentes', faqNotFoundText: 'Vous ne trouvez pas votre réponse ?', faqHelpCenterLink: "Consultez notre centre d'aide",
  faq1Q: 'Comment puis-je proposer un article pour SmarterBloggers Insights ?',
  faq1A: "Nous accueillons les contributions d'experts avec au moins 5 ans d'expérience dans leur domaine. Envoyez-nous un sujet + un plan + 2-3 références à contributors@smarterbloggers.com. Notre comité éditorial vous répond sous 5 jours ouvrés.",
  faq2Q: "Est-il possible de reprendre vos articles sur d'autres médias ?",
  faq2A: "Nos contenus sont protégés par le droit d'auteur. Cependant, nous autorisons la republication partielle (jusqu'à 300 mots) avec attribution claire et lien vers l'article original. Pour une republication intégrale, contactez-nous pour obtenir une licence.",
  faq3Q: 'Comment accéder aux contenus Premium ?',
  faq3A: "Les articles Premium sont accessibles via un abonnement mensuel ou annuel. Vous pouvez vous abonner depuis n'importe quelle page article Premium. L'abonnement vous donne accès à l'intégralité du catalogue Premium + les archives.",
  faq4Q: 'Proposez-vous des partenariats ou des contenus sponsorisés ?',
  faq4A: "Nous travaillons avec un nombre limité de partenaires dont les produits et services sont pertinents pour notre audience. Tout contenu commercial est clairement identifié comme tel. Contactez-nous via le formulaire pour discuter des opportunités.",
  faq5Q: 'Comment signaler une erreur dans un article ?',
  faq5A: "La précision est notre priorité. Si vous relevez une inexactitude, contactez-nous en précisant l'article concerné, l'erreur identifiée et votre source. Nous vérifions et corrigeons sous 48h avec une note de correction transparente.",
};
