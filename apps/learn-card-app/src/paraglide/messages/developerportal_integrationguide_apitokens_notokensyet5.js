/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Apitokens_Notokensyet5Inputs */

const en_developerportal_integrationguide_apitokens_notokensyet5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Notokensyet5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No API tokens yet`)
};

const es_developerportal_integrationguide_apitokens_notokensyet5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Notokensyet5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay tokens de API`)
};

const fr_developerportal_integrationguide_apitokens_notokensyet5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Notokensyet5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun jeton d'API pour le moment`)
};

const ar_developerportal_integrationguide_apitokens_notokensyet5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Notokensyet5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد رموز API بعد`)
};

/**
* | output |
* | --- |
* | "No API tokens yet" |
*
* @param {Developerportal_Integrationguide_Apitokens_Notokensyet5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_apitokens_notokensyet5 = /** @type {((inputs?: Developerportal_Integrationguide_Apitokens_Notokensyet5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Apitokens_Notokensyet5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_apitokens_notokensyet5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_apitokens_notokensyet5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_apitokens_notokensyet5(inputs)
	return ar_developerportal_integrationguide_apitokens_notokensyet5(inputs)
});
export { developerportal_integrationguide_apitokens_notokensyet5 as "developerPortal.integrationGuide.apiTokens.noTokensYet" }