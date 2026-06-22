/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Apitokens_Copyfailed4Inputs */

const en_developerportal_integrationguide_apitokens_copyfailed4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Copyfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to copy API Token`)
};

const es_developerportal_integrationguide_apitokens_copyfailed4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Copyfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al copiar el Token de API`)
};

const fr_developerportal_integrationguide_apitokens_copyfailed4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Copyfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la copie du jeton d'API`)
};

const ar_developerportal_integrationguide_apitokens_copyfailed4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Copyfailed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل نسخ رمز API`)
};

/**
* | output |
* | --- |
* | "Failed to copy API Token" |
*
* @param {Developerportal_Integrationguide_Apitokens_Copyfailed4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_apitokens_copyfailed4 = /** @type {((inputs?: Developerportal_Integrationguide_Apitokens_Copyfailed4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Apitokens_Copyfailed4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_apitokens_copyfailed4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_apitokens_copyfailed4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_apitokens_copyfailed4(inputs)
	return ar_developerportal_integrationguide_apitokens_copyfailed4(inputs)
});
export { developerportal_integrationguide_apitokens_copyfailed4 as "developerPortal.integrationGuide.apiTokens.copyFailed" }