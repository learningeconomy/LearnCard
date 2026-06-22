/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Permmethods_Requestconsent4Inputs */

const en_developerportal_integrationguide_permmethods_requestconsent4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Requestconsent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request user consent`)
};

const es_developerportal_integrationguide_permmethods_requestconsent4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Requestconsent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar consentimiento del usuario`)
};

const fr_developerportal_integrationguide_permmethods_requestconsent4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Requestconsent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander le consentement de l'utilisateur`)
};

const ar_developerportal_integrationguide_permmethods_requestconsent4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Requestconsent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب موافقة المستخدم`)
};

/**
* | output |
* | --- |
* | "Request user consent" |
*
* @param {Developerportal_Integrationguide_Permmethods_Requestconsent4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_permmethods_requestconsent4 = /** @type {((inputs?: Developerportal_Integrationguide_Permmethods_Requestconsent4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Permmethods_Requestconsent4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_permmethods_requestconsent4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_permmethods_requestconsent4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_permmethods_requestconsent4(inputs)
	return ar_developerportal_integrationguide_permmethods_requestconsent4(inputs)
});
export { developerportal_integrationguide_permmethods_requestconsent4 as "developerPortal.integrationGuide.permMethods.requestConsent" }