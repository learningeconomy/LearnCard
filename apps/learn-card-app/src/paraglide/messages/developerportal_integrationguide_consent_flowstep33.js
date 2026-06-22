/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Flowstep33Inputs */

const en_developerportal_integrationguide_consent_flowstep33 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard redirects back to your app with their DID`)
};

const es_developerportal_integrationguide_consent_flowstep33 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard redirige de vuelta a tu aplicación con su DID`)
};

const fr_developerportal_integrationguide_consent_flowstep33 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard redirige vers votre application avec son DID`)
};

const ar_developerportal_integrationguide_consent_flowstep33 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يعيد LearnCard التوجيه إلى تطبيقك مع DID الخاص به`)
};

/**
* | output |
* | --- |
* | "LearnCard redirects back to your app with their DID" |
*
* @param {Developerportal_Integrationguide_Consent_Flowstep33Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_flowstep33 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Flowstep33Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Flowstep33Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_flowstep33(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_flowstep33(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_flowstep33(inputs)
	return ar_developerportal_integrationguide_consent_flowstep33(inputs)
});
export { developerportal_integrationguide_consent_flowstep33 as "developerPortal.integrationGuide.consent.flowStep3" }