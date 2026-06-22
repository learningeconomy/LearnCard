/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Consent_Flowstep43Inputs */

const en_developerportal_integrationguide_consent_flowstep43 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your backend stores the user's DID`)
};

const es_developerportal_integrationguide_consent_flowstep43 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu backend almacena el DID del usuario`)
};

const fr_developerportal_integrationguide_consent_flowstep43 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre backend stocke le DID de l'utilisateur`)
};

const ar_developerportal_integrationguide_consent_flowstep43 = /** @type {(inputs: Developerportal_Integrationguide_Consent_Flowstep43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يخزن خادمك الخلفي DID المستخدم`)
};

/**
* | output |
* | --- |
* | "Your backend stores the user's DID" |
*
* @param {Developerportal_Integrationguide_Consent_Flowstep43Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_consent_flowstep43 = /** @type {((inputs?: Developerportal_Integrationguide_Consent_Flowstep43Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Consent_Flowstep43Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_consent_flowstep43(inputs)
	if (locale === "es") return es_developerportal_integrationguide_consent_flowstep43(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_consent_flowstep43(inputs)
	return ar_developerportal_integrationguide_consent_flowstep43(inputs)
});
export { developerportal_integrationguide_consent_flowstep43 as "developerPortal.integrationGuide.consent.flowStep4" }