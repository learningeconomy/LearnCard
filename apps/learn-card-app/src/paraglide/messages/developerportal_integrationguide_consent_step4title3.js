/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Step4title3Inputs */

const en_developerportal_integrationguide_consent_step4title3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step4title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Initialize LearnCard on Your Backend`)
};

const es_developerportal_integrationguide_consent_step4title3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step4title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicializa LearnCard en tu Backend`)
};

const fr_developerportal_integrationguide_consent_step4title3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step4title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Initialiser LearnCard sur Votre Backend`)
};

const ar_developerportal_integrationguide_consent_step4title3 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Step4title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تهيئة LearnCard على خادمك الخلفي`)
};

/**
* | output |
* | --- |
* | "Initialize LearnCard on Your Backend" |
*
* @param {Developerportal_Integrationguide_Consent_Step4title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_step4title3 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Step4title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Step4title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_step4title3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_step4title3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_step4title3(inputs)
	return ar_developerportal_integrationguide_consent_step4title3(inputs)
});
export { developerportal_integrationguide_consent_step4title3 as "developerPortal.integrationGuide.consent.step4Title" }