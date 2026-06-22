/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Apitokens_Securitynote4Inputs */

const en_developerportal_integrationguide_apitokens_securitynote4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Securitynote4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Never expose your API key in client-side code.`)
};

const es_developerportal_integrationguide_apitokens_securitynote4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Securitynote4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Never expose your API key in client-side code.`)
};

const fr_developerportal_integrationguide_apitokens_securitynote4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Securitynote4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Never expose your API key in client-side code.`)
};

const ar_developerportal_integrationguide_apitokens_securitynote4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Securitynote4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Never expose your API key in client-side code.`)
};

/**
* | output |
* | --- |
* | "Never expose your API key in client-side code." |
*
* @param {Developerportal_Integrationguide_Apitokens_Securitynote4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_apitokens_securitynote4 = /** @type {((inputs?: Developerportal_Integrationguide_Apitokens_Securitynote4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Apitokens_Securitynote4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_apitokens_securitynote4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_apitokens_securitynote4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_apitokens_securitynote4(inputs)
	return ar_developerportal_integrationguide_apitokens_securitynote4(inputs)
});
export { developerportal_integrationguide_apitokens_securitynote4 as "developerPortal.integrationGuide.apiTokens.securityNote" }