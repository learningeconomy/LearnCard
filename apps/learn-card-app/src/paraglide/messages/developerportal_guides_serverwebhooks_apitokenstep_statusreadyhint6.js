/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Serverwebhooks_Apitokenstep_Statusreadyhint6Inputs */

const en_developerportal_guides_serverwebhooks_apitokenstep_statusreadyhint6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Statusreadyhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy a token to use`)
};

const es_developerportal_guides_serverwebhooks_apitokenstep_statusreadyhint6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Statusreadyhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy a token to use`)
};

const fr_developerportal_guides_serverwebhooks_apitokenstep_statusreadyhint6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Statusreadyhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy a token to use`)
};

const ar_developerportal_guides_serverwebhooks_apitokenstep_statusreadyhint6 = /** @type {(inputs: Developerportal_Guides_Serverwebhooks_Apitokenstep_Statusreadyhint6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy a token to use`)
};

/**
* | output |
* | --- |
* | "Copy a token to use" |
*
* @param {Developerportal_Guides_Serverwebhooks_Apitokenstep_Statusreadyhint6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_serverwebhooks_apitokenstep_statusreadyhint6 = /** @type {((inputs?: Developerportal_Guides_Serverwebhooks_Apitokenstep_Statusreadyhint6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Serverwebhooks_Apitokenstep_Statusreadyhint6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_serverwebhooks_apitokenstep_statusreadyhint6(inputs)
	if (locale === "es") return es_developerportal_guides_serverwebhooks_apitokenstep_statusreadyhint6(inputs)
	if (locale === "fr") return fr_developerportal_guides_serverwebhooks_apitokenstep_statusreadyhint6(inputs)
	return ar_developerportal_guides_serverwebhooks_apitokenstep_statusreadyhint6(inputs)
});
export { developerportal_guides_serverwebhooks_apitokenstep_statusreadyhint6 as "developerPortal.guides.serverWebhooks.apiTokenStep.statusReadyHint" }