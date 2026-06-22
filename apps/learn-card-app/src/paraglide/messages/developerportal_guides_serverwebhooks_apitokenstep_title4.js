/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Apitokenstep_Title4Inputs */

const en_developerportal_guides_serverwebhooks_apitokenstep_title4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create an API Token`)
};

const es_developerportal_guides_serverwebhooks_apitokenstep_title4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create an API Token`)
};

const fr_developerportal_guides_serverwebhooks_apitokenstep_title4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create an API Token`)
};

const ar_developerportal_guides_serverwebhooks_apitokenstep_title4 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create an API Token`)
};

/**
* | output |
* | --- |
* | "Create an API Token" |
*
* @param {Developerportal_Guides_Serverwebhooks_Apitokenstep_Title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_apitokenstep_title4 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Apitokenstep_Title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Apitokenstep_Title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_apitokenstep_title4(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_apitokenstep_title4(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_apitokenstep_title4(inputs)
	return ar_developerportal_guides_serverwebhooks_apitokenstep_title4(inputs)
});
export { developerportal_guides_serverwebhooks_apitokenstep_title4 as "developerPortal.guides.serverWebhooks.apiTokenStep.title" }