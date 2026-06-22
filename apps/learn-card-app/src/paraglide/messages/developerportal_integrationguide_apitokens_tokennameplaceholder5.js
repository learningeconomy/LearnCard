/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Apitokens_Tokennameplaceholder5Inputs */

const en_developerportal_integrationguide_apitokens_tokennameplaceholder5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Tokennameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Production API`)
};

const es_developerportal_integrationguide_apitokens_tokennameplaceholder5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Tokennameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`p.ej., API de Producción`)
};

const fr_developerportal_integrationguide_apitokens_tokennameplaceholder5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Tokennameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`p.ex., API de Production`)
};

const ar_developerportal_integrationguide_apitokens_tokennameplaceholder5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Tokennameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: API الإنتاج`)
};

/**
* | output |
* | --- |
* | "e.g., Production API" |
*
* @param {Developerportal_Integrationguide_Apitokens_Tokennameplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_apitokens_tokennameplaceholder5 = /** @type {((inputs?: Developerportal_Integrationguide_Apitokens_Tokennameplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Apitokens_Tokennameplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_apitokens_tokennameplaceholder5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_apitokens_tokennameplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_apitokens_tokennameplaceholder5(inputs)
	return ar_developerportal_integrationguide_apitokens_tokennameplaceholder5(inputs)
});
export { developerportal_integrationguide_apitokens_tokennameplaceholder5 as "developerPortal.integrationGuide.apiTokens.tokenNamePlaceholder" }