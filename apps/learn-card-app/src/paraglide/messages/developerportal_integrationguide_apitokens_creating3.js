/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Apitokens_Creating3Inputs */

const en_developerportal_integrationguide_apitokens_creating3 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Creating3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creating...`)
};

const es_developerportal_integrationguide_apitokens_creating3 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Creating3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creando...`)
};

const fr_developerportal_integrationguide_apitokens_creating3 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Creating3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Création...`)
};

const ar_developerportal_integrationguide_apitokens_creating3 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Creating3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الإنشاء...`)
};

/**
* | output |
* | --- |
* | "Creating..." |
*
* @param {Developerportal_Integrationguide_Apitokens_Creating3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_apitokens_creating3 = /** @type {((inputs?: Developerportal_Integrationguide_Apitokens_Creating3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Apitokens_Creating3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_apitokens_creating3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_apitokens_creating3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_apitokens_creating3(inputs)
	return ar_developerportal_integrationguide_apitokens_creating3(inputs)
});
export { developerportal_integrationguide_apitokens_creating3 as "developerPortal.integrationGuide.apiTokens.creating" }