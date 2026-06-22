/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Apitokenstep_Createnewbutton6Inputs */

const en_developerportal_guides_serverwebhooks_apitokenstep_createnewbutton6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Createnewbutton6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create New Token`)
};

const es_developerportal_guides_serverwebhooks_apitokenstep_createnewbutton6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Createnewbutton6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create New Token`)
};

const fr_developerportal_guides_serverwebhooks_apitokenstep_createnewbutton6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Createnewbutton6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create New Token`)
};

const ar_developerportal_guides_serverwebhooks_apitokenstep_createnewbutton6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Createnewbutton6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create New Token`)
};

/**
* | output |
* | --- |
* | "Create New Token" |
*
* @param {Developerportal_Guides_Serverwebhooks_Apitokenstep_Createnewbutton6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_apitokenstep_createnewbutton6 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Apitokenstep_Createnewbutton6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Apitokenstep_Createnewbutton6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_apitokenstep_createnewbutton6(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_apitokenstep_createnewbutton6(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_apitokenstep_createnewbutton6(inputs)
	return ar_developerportal_guides_serverwebhooks_apitokenstep_createnewbutton6(inputs)
});
export { developerportal_guides_serverwebhooks_apitokenstep_createnewbutton6 as "developerPortal.guides.serverWebhooks.apiTokenStep.createNewButton" }