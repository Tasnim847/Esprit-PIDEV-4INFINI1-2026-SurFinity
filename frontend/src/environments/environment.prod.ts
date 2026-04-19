export const environment = {
  production: true,
  
  // ⚠️ À REMPLACER PAR VOTRE VRAIE CLÉ PUBLIQUE LIVE STRIPE
  // Pour obtenir votre clé live: https://dashboard.stripe.com/apikeys
  stripePublicKey: 'pk_test_51QslvaCFuk7NYR1j5UB5hyB9SchLFHFcKpHW4R83kVfjjBYOFmDIYoBROuexPE2cuW4KBwyZYpKpbrtuFltnYDgM00BnYo3ZXQ',
  
  // ⚠️ À REMPLACER PAR VOTRE DOMAINE DE PRODUCTION
  apiUrl: 'https://votre-domaine.com/api',
  
  // Webhook URL
  webhookUrl: 'https://votre-domaine.com/payments/stripe/webhook'
};