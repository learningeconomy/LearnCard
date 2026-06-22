/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Intro2Inputs */

const en_developerportal_integrationguide_consent_intro2 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Intro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the Consent Redirect flow to collect user consent and credentials from your external application. Users will be redirected to LearnCard to grant permissions, then back to your app with their credentials.`)
};

const es_developerportal_integrationguide_consent_intro2 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Intro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa el flujo de Consentimiento Redirigido para recopilar el consentimiento del usuario y las credenciales desde tu aplicación externa. Los usuarios serán redirigidos a LearnCard para otorgar permisos y luego volverán a tu aplicación con sus credenciales.`)
};

const fr_developerportal_integrationguide_consent_intro2 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Intro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisez le flux de Consentement Redirigé pour recueillir le consentement de l'utilisateur et les identifiants depuis votre application externe. Les utilisateurs seront redirigés vers LearnCard pour accorder des permissions, puis reviendront à votre application avec leurs identifiants.`)
};

const ar_developerportal_integrationguide_consent_intro2 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Intro2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم تدفق إعادة توجيه الموافقة لجمع موافقة المستخدم وبيانات الاعتماد من تطبيقك الخارجي. ستتم إعادة توجيه المستخدمين إلى LearnCard لمنح الصلاحيات، ثم العودة إلى تطبيقك مع بيانات اعتمادهم.`)
};

/**
* | output |
* | --- |
* | "Use the Consent Redirect flow to collect user consent and credentials from your external application. Users will be redirected to LearnCard to grant permissi..." |
*
* @param {Developerportal_Integrationguide_Consent_Intro2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_intro2 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Intro2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Intro2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_intro2(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_intro2(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_intro2(inputs)
	return ar_developerportal_integrationguide_consent_intro2(inputs)
});
export { developerportal_integrationguide_consent_intro2 as "developerPortal.integrationGuide.consent.intro" }