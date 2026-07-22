/**
 * Server-side notification message catalog + interpolation helper (LC-1831 C2).
 *
 * Notifications are server-side (SQS → webhook), so this is a plain in-repo
 * dictionary rather than Paraglide (which is client-only). Each message key is
 * mapped to a per-locale `{ title, body }` template. Dynamic values are passed
 * as `params` and interpolated via `{var}` placeholders.
 *
 * Resolution order in `getNotificationMessage`:
 *   1. Exact locale entry (e.g. `es`)
 *   2. English fallback (`en`) if the locale or key is missing
 *   3. The helper never throws — worst case it returns the EN entry.
 *
 * NOTE: `{var}` placeholders use simple string replacement. There is no ICU
 * pluralization support; keys that need singular/plural distinction are split
 * into separate `*Single` / `*Plural` entries (see `consentFlowTransactionSynced*`).
 */

/** Union of every supported message key in the catalog. */
export type NotificationMessageKey =
    | 'boostReceived'
    | 'boostAccepted'
    | 'credentialReceived'
    | 'endorsementReceived'
    | 'connectionAccepted'
    | 'connectionRequest'
    | 'connectionRequestExpiredInvite'
    | 'presentationReceived'
    | 'issuanceDelivered'
    | 'issuanceClaimed'
    | 'issuanceError'
    | 'guardianApprovalPending'
    | 'guardianApproved'
    | 'guardianRejected'
    | 'parentAccountApproved'
    | 'appListingSubmitted'
    | 'appListingWithdrawn'
    | 'appListingApproved'
    | 'appListingRejected'
    | 'consentFlowViewRequest'
    | 'consentFlowInvite'
    | 'consentFlowShare'
    // --- Consent-flow transaction contract notifications (accesslayer) ---
    | 'consentFlowTransactionCreated'
    | 'consentFlowInsightsShared'
    | 'consentFlowTransactionReconsented'
    | 'consentFlowTransactionUpdatedTerms'
    | 'consentFlowTransactionWithdrawn'
    | 'consentFlowTransactionSyncedSingle'
    | 'consentFlowTransactionSyncedPlural';

type MessageTemplate = { title: string; body: string };
type LocaleCatalog = Record<NotificationMessageKey, MessageTemplate>;

/** Locales currently supported by the catalog. */
export type NotificationLocale = 'en' | 'es' | 'fr' | 'ar';

const DEFAULT_LOCALE: NotificationLocale = 'en';

const en: LocaleCatalog = {
    boostReceived: {
        title: 'Boost Received',
        body: '{issuer} has boosted you!',
    },
    boostAccepted: {
        title: 'Boost Accepted',
        body: '{name} has accepted your boost!',
    },
    credentialReceived: {
        title: 'Credential Received',
        body: '{from} has sent you a credential',
    },
    endorsementReceived: {
        title: 'New Endorsement Received',
        body: '{from} has endorsed your credential',
    },
    connectionAccepted: {
        title: 'Connection Accepted',
        body: '{name} has accepted your connection request!',
    },
    connectionRequest: {
        title: 'New Connection Request',
        body: '{name} has sent you a connection request!',
    },
    connectionRequestExpiredInvite: {
        title: 'Connection Request (Expired Invite)',
        body: '{name} tried to connect with an expired link and has sent you a connection request.',
    },
    presentationReceived: {
        title: 'Presentation Received',
        body: '{from} has sent you a presentation!',
    },
    issuanceDelivered: {
        title: 'Credential Delivered to Inbox',
        body: "{issuer} sent a credential to {recipientType}'s inbox at {recipientValue}!",
    },
    issuanceClaimed: {
        title: 'Credential Claimed from Inbox',
        body: '{value} claimed a credential from their inbox.',
    },
    issuanceError: {
        title: 'Credential Issuance Error from Inbox',
        body: '{value} failed to claim a credential from their inbox.',
    },
    guardianApprovalPending: {
        title: 'Credential Approval Request',
        body: '{credentialName} for {childName} from {issuer}',
    },
    guardianApproved: {
        title: 'Credential Approved',
        body: 'Your guardian approved "{credentialName}" for you.',
    },
    guardianRejected: {
        title: 'Credential Rejected',
        body: 'Your guardian did not approve "{credentialName}".',
    },
    parentAccountApproved: {
        title: 'Account Approved',
        body: 'Your account has been approved by your parent or guardian.',
    },
    appListingSubmitted: {
        title: 'New App Listing Submitted',
        body: '"{displayName}" has been submitted for review.',
    },
    appListingWithdrawn: {
        title: 'App Listing Withdrawn',
        body: '"{displayName}" has been withdrawn from review.',
    },
    appListingApproved: {
        title: 'App Listing Approved!',
        body: '"{displayName}" has been approved and is now live in the App Store.',
    },
    appListingRejected: {
        title: 'App Listing Needs Changes',
        body: '"{displayName}" was not approved. Please review and resubmit.',
    },
    consentFlowViewRequest: {
        title: 'AI Insights',
        body: '{name} has requested to view your insights.',
    },
    consentFlowInvite: {
        title: 'AI Insights',
        body: '{name} is inviting you to view their insights. Request access to continue.',
    },
    consentFlowShare: {
        title: 'AI Insights',
        body: '{name} would like to share their insights with {targetName}.',
    },
    consentFlowTransactionCreated: {
        title: 'New Consent Transaction',
        body: '{consenter} has just consented to {contractName}!',
    },
    consentFlowInsightsShared: {
        title: 'AI Insights',
        body: '{consenter} has shared their insights with you.',
    },
    consentFlowTransactionReconsented: {
        title: 'New Consent Transaction',
        body: '{consenter} has just reconsented to {contractName}!',
    },
    consentFlowTransactionUpdatedTerms: {
        title: 'New Consent Transaction',
        body: '{consenter} has just updated their terms to {contractName}!',
    },
    consentFlowTransactionWithdrawn: {
        title: 'New Consent Transaction',
        body: '{consenter} has just withdrawn their terms to {contractName}!',
    },
    consentFlowTransactionSyncedSingle: {
        title: 'New Consent Transaction',
        body: '{consenter} has synced {totalCredentials} credential(s) across {categoryCount} category to {contractName}!',
    },
    consentFlowTransactionSyncedPlural: {
        title: 'New Consent Transaction',
        body: '{consenter} has synced {totalCredentials} credential(s) across {categoryCount} categories to {contractName}!',
    },
};

const es: LocaleCatalog = {
    boostReceived: {
        title: 'Reconocimiento recibido',
        body: '¡{issuer} te ha enviado un reconocimiento!',
    },
    boostAccepted: {
        title: 'Reconocimiento aceptado',
        body: '¡{name} ha aceptado tu reconocimiento!',
    },
    credentialReceived: {
        title: 'Credencial recibida',
        body: '{from} te ha enviado una credencial',
    },
    endorsementReceived: {
        title: 'Nueva validación recibida',
        body: '{from} ha validado tu credencial',
    },
    connectionAccepted: {
        title: 'Conexión aceptada',
        body: '¡{name} ha aceptado tu solicitud de conexión!',
    },
    connectionRequest: {
        title: 'Nueva solicitud de conexión',
        body: '¡{name} te ha enviado una solicitud de conexión!',
    },
    connectionRequestExpiredInvite: {
        title: 'Solicitud de conexión (invitación caducada)',
        body: '{name} intentó conectarse con un enlace caducado y te ha enviado una solicitud de conexión.',
    },
    presentationReceived: {
        title: 'Presentación recibida',
        body: '¡{from} te ha enviado una presentación!',
    },
    issuanceDelivered: {
        title: 'Credencial entregada al buzón',
        body: '¡{issuer} envió una credencial al buzón de {recipientType} en {recipientValue}!',
    },
    issuanceClaimed: {
        title: 'Credencial reclamada desde el buzón',
        body: '{value} reclamó una credencial desde su buzón.',
    },
    issuanceError: {
        title: 'Error de emisión de credencial desde el buzón',
        body: '{value} no pudo reclamar una credencial desde su buzón.',
    },
    guardianApprovalPending: {
        title: 'Solicitud de aprobación de credencial',
        body: '{credentialName} para {childName} de {issuer}',
    },
    guardianApproved: {
        title: 'Credencial aprobada',
        body: 'Tu tutor aprobó "{credentialName}" para ti.',
    },
    guardianRejected: {
        title: 'Credencial rechazada',
        body: 'Tu tutor no aprobó "{credentialName}".',
    },
    parentAccountApproved: {
        title: 'Cuenta aprobada',
        body: 'Tu cuenta ha sido aprobada por tu padre, madre o tutor.',
    },
    appListingSubmitted: {
        title: 'Nueva aplicación enviada',
        body: '"{displayName}" se ha enviado para revisión.',
    },
    appListingWithdrawn: {
        title: 'Aplicación retirada',
        body: '"{displayName}" se ha retirado de la revisión.',
    },
    appListingApproved: {
        title: '¡Aplicación aprobada!',
        body: '"{displayName}" ha sido aprobada y ya está disponible en la App Store.',
    },
    appListingRejected: {
        title: 'La aplicación necesita cambios',
        body: '"{displayName}" no fue aprobada. Revísala y vuelve a enviarla.',
    },
    consentFlowViewRequest: {
        title: 'AI Insights',
        body: '{name} ha solicitado ver tus análisis.',
    },
    consentFlowInvite: {
        title: 'AI Insights',
        body: '{name} te invita a ver sus análisis. Solicita acceso para continuar.',
    },
    consentFlowShare: {
        title: 'AI Insights',
        body: 'A {name} le gustaría compartir sus análisis con {targetName}.',
    },
    consentFlowTransactionCreated: {
        title: 'Nueva transacción de consentimiento',
        body: '¡{consenter} acaba de dar su consentimiento a {contractName}!',
    },
    consentFlowInsightsShared: {
        title: 'AI Insights',
        body: '{consenter} ha compartido sus análisis contigo.',
    },
    consentFlowTransactionReconsented: {
        title: 'Nueva transacción de consentimiento',
        body: '¡{consenter} acaba de volver a dar su consentimiento a {contractName}!',
    },
    consentFlowTransactionUpdatedTerms: {
        title: 'Nueva transacción de consentimiento',
        body: '¡{consenter} acaba de actualizar sus términos para {contractName}!',
    },
    consentFlowTransactionWithdrawn: {
        title: 'Nueva transacción de consentimiento',
        body: '¡{consenter} acaba de retirar sus términos para {contractName}!',
    },
    consentFlowTransactionSyncedSingle: {
        title: 'Nueva transacción de consentimiento',
        body: '¡{consenter} ha sincronizado {totalCredentials} credencial(es) en {categoryCount} categoría con {contractName}!',
    },
    consentFlowTransactionSyncedPlural: {
        title: 'Nueva transacción de consentimiento',
        body: '¡{consenter} ha sincronizado {totalCredentials} credenciales en {categoryCount} categorías con {contractName}!',
    },
};

const fr: LocaleCatalog = {
    boostReceived: {
        title: 'Reconnaissance reçue',
        body: '{issuer} vous a envoyé une reconnaissance !',
    },
    boostAccepted: {
        title: 'Reconnaissance acceptée',
        body: '{name} a accepté votre reconnaissance !',
    },
    credentialReceived: {
        title: 'Titre reçu',
        body: '{from} vous a envoyé un titre',
    },
    endorsementReceived: {
        title: 'Nouvelle validation reçue',
        body: '{from} a validé votre titre',
    },
    connectionAccepted: {
        title: 'Connexion acceptée',
        body: '{name} a accepté votre demande de connexion !',
    },
    connectionRequest: {
        title: 'Nouvelle demande de connexion',
        body: '{name} vous a envoyé une demande de connexion !',
    },
    connectionRequestExpiredInvite: {
        title: 'Demande de connexion (invitation expirée)',
        body: '{name} a tenté de se connecter avec un lien expiré et vous a envoyé une demande de connexion.',
    },
    presentationReceived: {
        title: 'Présentation reçue',
        body: '{from} vous a envoyé une présentation !',
    },
    issuanceDelivered: {
        title: 'Titre livré à la boîte de réception',
        body: '{issuer} a envoyé un titre à la boîte de réception de {recipientType} à {recipientValue} !',
    },
    issuanceClaimed: {
        title: 'Titre récupéré depuis la boîte de réception',
        body: '{value} a récupéré un titre depuis sa boîte de réception.',
    },
    issuanceError: {
        title: "Erreur d'émission de titre depuis la boîte de réception",
        body: "{value} n'a pas pu récupérer un titre depuis sa boîte de réception.",
    },
    guardianApprovalPending: {
        title: "Demande d'approbation de titre",
        body: '{credentialName} pour {childName} de {issuer}',
    },
    guardianApproved: {
        title: 'Titre approuvé',
        body: 'Votre tuteur a approuvé « {credentialName} » pour vous.',
    },
    guardianRejected: {
        title: 'Titre refusé',
        body: "Votre tuteur n'a pas approuvé « {credentialName} ».",
    },
    parentAccountApproved: {
        title: 'Compte approuvé',
        body: 'Votre compte a été approuvé par votre parent ou tuteur.',
    },
    appListingSubmitted: {
        title: 'Nouvelle application soumise',
        body: '« {displayName} » a été soumise pour révision.',
    },
    appListingWithdrawn: {
        title: 'Application retirée',
        body: '« {displayName} » a été retirée de la révision.',
    },
    appListingApproved: {
        title: 'Application approuvée !',
        body: "« {displayName} » a été approuvée et est désormais disponible dans l'App Store.",
    },
    appListingRejected: {
        title: "L'application nécessite des modifications",
        body: "« {displayName} » n'a pas été approuvée. Veuillez la réviser et la soumettre à nouveau.",
    },
    consentFlowViewRequest: {
        title: 'AI Insights',
        body: '{name} a demandé à consulter vos analyses.',
    },
    consentFlowInvite: {
        title: 'AI Insights',
        body: "{name} vous invite à consulter ses analyses. Demandez l'accès pour continuer.",
    },
    consentFlowShare: {
        title: 'AI Insights',
        body: '{name} souhaite partager ses analyses avec {targetName}.',
    },
    consentFlowTransactionCreated: {
        title: 'Nouvelle transaction de consentement',
        body: '{consenter} vient de donner son consentement à {contractName} !',
    },
    consentFlowInsightsShared: {
        title: 'AI Insights',
        body: '{consenter} a partagé ses analyses avec vous.',
    },
    consentFlowTransactionReconsented: {
        title: 'Nouvelle transaction de consentement',
        body: '{consenter} vient de redonner son consentement à {contractName} !',
    },
    consentFlowTransactionUpdatedTerms: {
        title: 'Nouvelle transaction de consentement',
        body: '{consenter} vient de mettre à jour ses conditions pour {contractName} !',
    },
    consentFlowTransactionWithdrawn: {
        title: 'Nouvelle transaction de consentement',
        body: '{consenter} vient de retirer ses conditions pour {contractName} !',
    },
    consentFlowTransactionSyncedSingle: {
        title: 'Nouvelle transaction de consentement',
        body: '{consenter} a synchronisé {totalCredentials} titre(s) dans {categoryCount} catégorie avec {contractName} !',
    },
    consentFlowTransactionSyncedPlural: {
        title: 'Nouvelle transaction de consentement',
        body: '{consenter} a synchronisé {totalCredentials} titres dans {categoryCount} catégories avec {contractName} !',
    },
};

const ar: LocaleCatalog = {
    boostReceived: {
        title: 'تم استلام تحفيز',
        body: 'قام {issuer} بتحفيزك!',
    },
    boostAccepted: {
        title: 'تم قبول التحفيز',
        body: 'قام {name} بقبول التحفيز الخاص بك!',
    },
    credentialReceived: {
        title: 'تم استلام شهادة',
        body: 'أرسل لك {from} شهادة',
    },
    endorsementReceived: {
        title: 'تم استلام تأييد جديد',
        body: 'قام {from} بتأييد شهادتك',
    },
    connectionAccepted: {
        title: 'تم قبول الاتصال',
        body: 'قام {name} بقبول طلب الاتصال الخاص بك!',
    },
    connectionRequest: {
        title: 'طلب اتصال جديد',
        body: 'أرسل لك {name} طلب اتصال!',
    },
    connectionRequestExpiredInvite: {
        title: 'طلب اتصال (دعوة منتهية الصلاحية)',
        body: 'حاول {name} الاتصال برابط منتهي الصلاحية وأرسل لك طلب اتصال.',
    },
    presentationReceived: {
        title: 'تم استلام عرض',
        body: 'أرسل لك {from} عرضًا!',
    },
    issuanceDelivered: {
        title: 'تم تسليم الشهادة إلى صندوق الوارد',
        body: 'أرسل {issuer} شهادة إلى صندوق وارد {recipientType} على {recipientValue}!',
    },
    issuanceClaimed: {
        title: 'تم استلام الشهادة من صندوق الوارد',
        body: 'قام {value} باستلام شهادة من صندوق الوارد الخاص به.',
    },
    issuanceError: {
        title: 'خطأ في إصدار الشهادة من صندوق الوارد',
        body: 'تعذّر على {value} استلام شهادة من صندوق الوارد الخاص به.',
    },
    guardianApprovalPending: {
        title: 'طلب الموافقة على الشهادة',
        body: '{credentialName} لـ {childName} من {issuer}',
    },
    guardianApproved: {
        title: 'تمت الموافقة على الشهادة',
        body: 'وافق ولي أمرك على "{credentialName}" لك.',
    },
    guardianRejected: {
        title: 'تم رفض الشهادة',
        body: 'لم يوافق ولي أمرك على "{credentialName}".',
    },
    parentAccountApproved: {
        title: 'تمت الموافقة على الحساب',
        body: 'تمت الموافقة على حسابك من قبل ولي أمرك.',
    },
    appListingSubmitted: {
        title: 'تم إرسال تطبيق جديد',
        body: 'تم إرسال "{displayName}" للمراجعة.',
    },
    appListingWithdrawn: {
        title: 'تم سحب التطبيق',
        body: 'تم سحب "{displayName}" من المراجعة.',
    },
    appListingApproved: {
        title: 'تمت الموافقة على التطبيق!',
        body: 'تمت الموافقة على "{displayName}" وهو الآن متاح في متجر التطبيقات.',
    },
    appListingRejected: {
        title: 'التطبيق يحتاج إلى تعديلات',
        body: 'لم تتم الموافقة على "{displayName}". يرجى مراجعته وإعادة إرساله.',
    },
    consentFlowViewRequest: {
        title: 'رؤى الذكاء الاصطناعي',
        body: 'طلب {name} الاطلاع على رؤاك.',
    },
    consentFlowInvite: {
        title: 'رؤى الذكاء الاصطناعي',
        body: 'يدعوك {name} للاطلاع على رؤاه. اطلب الوصول للمتابعة.',
    },
    consentFlowShare: {
        title: 'رؤى الذكاء الاصطناعي',
        body: 'يرغب {name} في مشاركة رؤاه مع {targetName}.',
    },
    consentFlowTransactionCreated: {
        title: 'معاملة موافقة جديدة',
        body: 'قام {consenter} للتو بالموافقة على {contractName}!',
    },
    consentFlowInsightsShared: {
        title: 'رؤى الذكاء الاصطناعي',
        body: 'شارك {consenter} رؤاه معك.',
    },
    consentFlowTransactionReconsented: {
        title: 'معاملة موافقة جديدة',
        body: 'قام {consenter} للتو بإعادة الموافقة على {contractName}!',
    },
    consentFlowTransactionUpdatedTerms: {
        title: 'معاملة موافقة جديدة',
        body: 'قام {consenter} للتو بتحديث شروطه لـ {contractName}!',
    },
    consentFlowTransactionWithdrawn: {
        title: 'معاملة موافقة جديدة',
        body: 'قام {consenter} للتو بسحب شروطه لـ {contractName}!',
    },
    consentFlowTransactionSyncedSingle: {
        title: 'معاملة موافقة جديدة',
        body: 'قام {consenter} بمزامنة {totalCredentials} شهادة في {categoryCount} فئة مع {contractName}!',
    },
    consentFlowTransactionSyncedPlural: {
        title: 'معاملة موافقة جديدة',
        body: 'قام {consenter} بمزامنة {totalCredentials} شهادة عبر {categoryCount} فئات مع {contractName}!',
    },
};

const CATALOGS: Record<NotificationLocale, LocaleCatalog> = { en, es, fr, ar };

/**
 * Narrow an arbitrary runtime locale string (BCP-47, e.g. `es`, `es-MX`) down
 * to one of the supported catalog locales. Falls back to `en`.
 */
const resolveCatalogLocale = (locale: string): NotificationLocale => {
    if (typeof locale !== 'string' || locale.length === 0) return DEFAULT_LOCALE;
    const base = locale.toLowerCase().split('-')[0] as NotificationLocale;
    if (base in CATALOGS) return base;
    return DEFAULT_LOCALE;
};

/** Replace `{var}` placeholders in `template` with values from `params`. */
const interpolate = (template: string, params: Record<string, string | undefined>): string =>
    template.replace(/\{(\w+)\}/g, (match, key: string) => {
        const value = params[key];
        return value === undefined ? match : value;
    });

/**
 * Resolve a localized notification message for `key` in `locale`.
 *
 * @param key    Message key (see {@link NotificationMessageKey}).
 * @param locale Recipient locale (BCP-47). Unknown/unsupported → English.
 * @param params Values for `{var}` placeholders. Undefined values leave the
 *               placeholder verbatim.
 * @returns `{ title, body }` with placeholders interpolated. Never throws —
 *          falls back to the English entry if the locale or key is missing.
 */
export const getNotificationMessage = (
    key: NotificationMessageKey,
    locale: string,
    params: Record<string, string | undefined> = {}
): MessageTemplate => {
    const catalogLocale = resolveCatalogLocale(locale);
    // Defensive: a valid NotificationMessageKey is always present in every
    // catalog (enforced by the Record type), but guard against an unexpected
    // runtime value so the helper never throws.
    const entry =
        CATALOGS[catalogLocale][key] ??
        CATALOGS[DEFAULT_LOCALE][key] ??
        ({ title: '', body: '' } as MessageTemplate);

    return {
        title: interpolate(entry.title, params),
        body: interpolate(entry.body, params),
    };
};
