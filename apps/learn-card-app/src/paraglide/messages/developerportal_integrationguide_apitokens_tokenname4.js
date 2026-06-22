/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Apitokens_Tokenname4Inputs */

const en_developerportal_integrationguide_apitokens_tokenname4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Tokenname4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token Name`)
};

const es_developerportal_integrationguide_apitokens_tokenname4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Tokenname4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del Token`)
};

const fr_developerportal_integrationguide_apitokens_tokenname4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Tokenname4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du Jeton`)
};

const ar_developerportal_integrationguide_apitokens_tokenname4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Tokenname4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم الرمز`)
};

/**
* | output |
* | --- |
* | "Token Name" |
*
* @param {Developerportal_Integrationguide_Apitokens_Tokenname4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_apitokens_tokenname4 = /** @type {((inputs?: Developerportal_Integrationguide_Apitokens_Tokenname4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Apitokens_Tokenname4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_apitokens_tokenname4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_apitokens_tokenname4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_apitokens_tokenname4(inputs)
	return ar_developerportal_integrationguide_apitokens_tokenname4(inputs)
});
export { developerportal_integrationguide_apitokens_tokenname4 as "developerPortal.integrationGuide.apiTokens.tokenName" }