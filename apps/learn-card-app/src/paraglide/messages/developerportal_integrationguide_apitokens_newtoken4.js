/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Apitokens_Newtoken4Inputs */

const en_developerportal_integrationguide_apitokens_newtoken4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Newtoken4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Token`)
};

const es_developerportal_integrationguide_apitokens_newtoken4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Newtoken4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo Token`)
};

const fr_developerportal_integrationguide_apitokens_newtoken4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Newtoken4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau Jeton`)
};

const ar_developerportal_integrationguide_apitokens_newtoken4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Newtoken4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز جديد`)
};

/**
* | output |
* | --- |
* | "New Token" |
*
* @param {Developerportal_Integrationguide_Apitokens_Newtoken4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_apitokens_newtoken4 = /** @type {((inputs?: Developerportal_Integrationguide_Apitokens_Newtoken4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Apitokens_Newtoken4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_apitokens_newtoken4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_apitokens_newtoken4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_apitokens_newtoken4(inputs)
	return ar_developerportal_integrationguide_apitokens_newtoken4(inputs)
});
export { developerportal_integrationguide_apitokens_newtoken4 as "developerPortal.integrationGuide.apiTokens.newToken" }