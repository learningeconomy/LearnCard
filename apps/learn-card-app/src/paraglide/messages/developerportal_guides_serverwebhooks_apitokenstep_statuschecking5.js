/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Apitokenstep_Statuschecking5Inputs */

const en_developerportal_guides_serverwebhooks_apitokenstep_statuschecking5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Statuschecking5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking...`)
};

const es_developerportal_guides_serverwebhooks_apitokenstep_statuschecking5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Statuschecking5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking...`)
};

const fr_developerportal_guides_serverwebhooks_apitokenstep_statuschecking5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Statuschecking5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking...`)
};

const ar_developerportal_guides_serverwebhooks_apitokenstep_statuschecking5 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Statuschecking5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking...`)
};

/**
* | output |
* | --- |
* | "Checking..." |
*
* @param {Developerportal_Guides_Serverwebhooks_Apitokenstep_Statuschecking5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_apitokenstep_statuschecking5 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Apitokenstep_Statuschecking5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Apitokenstep_Statuschecking5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_apitokenstep_statuschecking5(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_apitokenstep_statuschecking5(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_apitokenstep_statuschecking5(inputs)
	return ar_developerportal_guides_serverwebhooks_apitokenstep_statuschecking5(inputs)
});
export { developerportal_guides_serverwebhooks_apitokenstep_statuschecking5 as "developerPortal.guides.serverWebhooks.apiTokenStep.statusChecking" }