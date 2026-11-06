const messages = {
    en: {
        title: 'Email announcements',
        confirm: 'Stop receiving email announcements for your account?',
        success: 'You’re unsubscribed from email announcements.',
        invalid: 'This link is invalid. Try a link from a newer email.',
        error: 'We couldn’t update your preferences. Please try again.',
        unsubscribe: 'Unsubscribe',
        retry: 'Try Again',
    },
    es: {
        title: 'Anuncios por correo electrónico',
        confirm: '¿Quieres dejar de recibir anuncios por correo electrónico?',
        success: 'Ya no recibirás anuncios por correo electrónico.',
        invalid: 'Este enlace no es válido. Prueba un enlace de un correo más reciente.',
        error: 'No pudimos actualizar tus preferencias. Inténtalo de nuevo.',
        unsubscribe: 'Cancelar suscripción',
        retry: 'Intentar de nuevo',
    },
    fr: {
        title: 'Annonces par e-mail',
        confirm: 'Ne plus recevoir d’annonces par e-mail pour votre compte ? ',
        success: 'Vous ne recevrez plus d’annonces par e-mail.',
        invalid: 'Ce lien est invalide. Essayez un lien provenant d’un e-mail plus récent.',
        error: 'Vos préférences n’ont pas pu être mises à jour. Veuillez réessayer.',
        unsubscribe: 'Se désinscrire',
        retry: 'Réessayer',
    },
    ar: {
        title: 'إعلانات البريد الإلكتروني',
        confirm: 'هل تريد إيقاف تلقي إعلانات البريد الإلكتروني لحسابك؟',
        success: 'تم إلغاء اشتراكك في إعلانات البريد الإلكتروني.',
        invalid: 'هذا الرابط غير صالح. جرّب رابطًا من رسالة بريد إلكتروني أحدث.',
        error: 'تعذر تحديث تفضيلاتك. يرجى المحاولة مرة أخرى.',
        unsubscribe: 'إلغاء الاشتراك',
        retry: 'حاول مرة أخرى',
    },
};

/** Standalone anonymous browser flow with no external assets or telemetry. */
export const renderCampaignUnsubscribePage = (
    state: 'confirm' | 'success' | 'invalid' | 'error',
    token?: string,
    language = 'en'
): string => {
    const requested = language.toLowerCase().split(/[-,;]/)[0] ?? 'en';
    const locale = Object.hasOwn(messages, requested) ? (requested as keyof typeof messages) : 'en';
    const copy = messages[locale];
    const safeToken = token && /^[A-Za-z0-9_-]{1,2048}$/.test(token) ? token : undefined;
    const content = {
        success: `<p role="status">${copy.success}</p>`,
        error: `<p role="alert">${copy.error}</p>`,
        invalid: `<p role="alert">${copy.invalid}</p>`,
        confirm: `<p>${copy.confirm}</p>`,
    }[state];
    const form =
        state !== 'success' && safeToken
            ? `<form method="post" action="/campaigns/unsubscribe/browser">
            <input type="hidden" name="token" value="${safeToken}">
            <button type="submit">${state === 'error' ? copy.retry : copy.unsubscribe}</button>
           </form>`
            : '';
    return `<!doctype html>
<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="referrer" content="no-referrer">
    <title>${copy.title}</title>
    <style>
        body {
            margin: 0;
            background: #EFF0F5;
            color: #18224E;
            font-family: system-ui, sans-serif;
            min-height: 100vh;
            display: grid;
            place-items: center;
        }
        main {
            box-sizing: border-box;
            background: white;
            border-radius: 20px;
            padding: 32px;
            margin: 24px;
            max-width: 480px;
            text-align: center;
        }
        h1 { font-size: 24px; }
        p { color: #6F7590; line-height: 1.6; }
        button {
            background: #18224E;
            color: white;
            border: 0;
            border-radius: 20px;
            padding: 12px 24px;
            font: inherit;
            cursor: pointer;
        }
        button:focus-visible { outline: 3px solid #059669; outline-offset: 3px; }
    </style>
</head>
<body>
    <main><h1>${copy.title}</h1>${content}${form}</main>
</body>
</html>`;
};
