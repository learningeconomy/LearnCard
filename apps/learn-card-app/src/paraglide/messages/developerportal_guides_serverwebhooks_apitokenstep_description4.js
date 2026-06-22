/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Apitokenstep_Description4Inputs */

const en_developerportal_guides_serverwebhooks_apitokenstep_description4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll need an API token to authenticate webhook requests and make API calls from your server.`)
};

const es_developerportal_guides_serverwebhooks_apitokenstep_description4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll need an API token to authenticate webhook requests and make API calls from your server.`)
};

const fr_developerportal_guides_serverwebhooks_apitokenstep_description4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll need an API token to authenticate webhook requests and make API calls from your server.`)
};

const ar_developerportal_guides_serverwebhooks_apitokenstep_description4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll need an API token to authenticate webhook requests and make API calls from your server.`)
};

/**
* | output |
* | --- |
* | "You'll need an API token to authenticate webhook requests and make API calls from your server." |
*
* @param {Developerportal_Guides_Serverwebhooks_Apitokenstep_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_apitokenstep_description4 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Apitokenstep_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Apitokenstep_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_apitokenstep_description4(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_apitokenstep_description4(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_apitokenstep_description4(inputs)
	return ar_developerportal_guides_serverwebhooks_apitokenstep_description4(inputs)
});
export { developerportal_guides_serverwebhooks_apitokenstep_description4 as "developerPortal.guides.serverWebhooks.apiTokenStep.description" }