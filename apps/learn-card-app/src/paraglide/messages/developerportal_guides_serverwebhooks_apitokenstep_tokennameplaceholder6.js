/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Apitokenstep_Tokennameplaceholder6Inputs */

const en_developerportal_guides_serverwebhooks_apitokenstep_tokennameplaceholder6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Tokennameplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Webhook Server`)
};

const es_developerportal_guides_serverwebhooks_apitokenstep_tokennameplaceholder6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Tokennameplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Webhook Server`)
};

const fr_developerportal_guides_serverwebhooks_apitokenstep_tokennameplaceholder6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Tokennameplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Webhook Server`)
};

const ar_developerportal_guides_serverwebhooks_apitokenstep_tokennameplaceholder6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Tokennameplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Webhook Server`)
};

/**
* | output |
* | --- |
* | "e.g., Webhook Server" |
*
* @param {Developerportal_Guides_Serverwebhooks_Apitokenstep_Tokennameplaceholder6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_apitokenstep_tokennameplaceholder6 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Apitokenstep_Tokennameplaceholder6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Apitokenstep_Tokennameplaceholder6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_apitokenstep_tokennameplaceholder6(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_apitokenstep_tokennameplaceholder6(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_apitokenstep_tokennameplaceholder6(inputs)
	return ar_developerportal_guides_serverwebhooks_apitokenstep_tokennameplaceholder6(inputs)
});
export { developerportal_guides_serverwebhooks_apitokenstep_tokennameplaceholder6 as "developerPortal.guides.serverWebhooks.apiTokenStep.tokenNamePlaceholder" }