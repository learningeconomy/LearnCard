/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Integrationguide_Apitokens_Activetokens4Inputs */

const en_developerportal_integrationguide_apitokens_activetokens4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Activetokens4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} active token(s)`)
};

const es_developerportal_integrationguide_apitokens_activetokens4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Activetokens4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} token(s) activo(s)`)
};

const fr_developerportal_integrationguide_apitokens_activetokens4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Activetokens4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} jeton(s) actif(s)`)
};

const ar_developerportal_integrationguide_apitokens_activetokens4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Activetokens4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} رمز (رموز) نشط`)
};

/**
* | output |
* | --- |
* | "{count} active token(s)" |
*
* @param {Developerportal_Integrationguide_Apitokens_Activetokens4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_apitokens_activetokens4 = /** @type {((inputs: Developerportal_Integrationguide_Apitokens_Activetokens4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Apitokens_Activetokens4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_apitokens_activetokens4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_apitokens_activetokens4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_apitokens_activetokens4(inputs)
	return ar_developerportal_integrationguide_apitokens_activetokens4(inputs)
});
export { developerportal_integrationguide_apitokens_activetokens4 as "developerPortal.integrationGuide.apiTokens.activeTokens" }