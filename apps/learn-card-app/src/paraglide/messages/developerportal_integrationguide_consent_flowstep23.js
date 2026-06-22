/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Flowstep23Inputs */

const en_developerportal_integrationguide_consent_flowstep23 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User is redirected to LearnCard to grant consent`)
};

const es_developerportal_integrationguide_consent_flowstep23 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El usuario es redirigido a LearnCard para otorgar consentimiento`)
};

const fr_developerportal_integrationguide_consent_flowstep23 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'utilisateur est redirigé vers LearnCard pour accorder son consentement`)
};

const ar_developerportal_integrationguide_consent_flowstep23 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تتم إعادة توجيه المستخدم إلى LearnCard لمنح الموافقة`)
};

/**
* | output |
* | --- |
* | "User is redirected to LearnCard to grant consent" |
*
* @param {Developerportal_Integrationguide_Consent_Flowstep23Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_flowstep23 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Flowstep23Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Flowstep23Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_flowstep23(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_flowstep23(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_flowstep23(inputs)
	return ar_developerportal_integrationguide_consent_flowstep23(inputs)
});
export { developerportal_integrationguide_consent_flowstep23 as "developerPortal.integrationGuide.consent.flowStep2" }