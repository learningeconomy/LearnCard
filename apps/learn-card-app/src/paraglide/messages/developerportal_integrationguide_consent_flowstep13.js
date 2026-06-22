/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Flowstep13Inputs */

const en_developerportal_integrationguide_consent_flowstep13 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User clicks "Connect with LearnCard" in your app`)
};

const es_developerportal_integrationguide_consent_flowstep13 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El usuario hace clic en "Conectar con LearnCard" en tu aplicación`)
};

const fr_developerportal_integrationguide_consent_flowstep13 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'utilisateur clique sur "Se connecter avec LearnCard" dans votre application`)
};

const ar_developerportal_integrationguide_consent_flowstep13 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ينقر المستخدم على "الاتصال بـ LearnCard" في تطبيقك`)
};

/**
* | output |
* | --- |
* | "User clicks \"Connect with LearnCard\" in your app" |
*
* @param {Developerportal_Integrationguide_Consent_Flowstep13Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_flowstep13 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Flowstep13Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Flowstep13Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_flowstep13(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_flowstep13(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_flowstep13(inputs)
	return ar_developerportal_integrationguide_consent_flowstep13(inputs)
});
export { developerportal_integrationguide_consent_flowstep13 as "developerPortal.integrationGuide.consent.flowStep1" }