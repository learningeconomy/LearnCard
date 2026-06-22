/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Apitokens_Createdfromguide5Inputs */

const en_developerportal_integrationguide_apitokens_createdfromguide5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Createdfromguide5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Created from Integration Guide`)
};

const es_developerportal_integrationguide_apitokens_createdfromguide5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Createdfromguide5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creado desde la Guía de Integración`)
};

const fr_developerportal_integrationguide_apitokens_createdfromguide5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Createdfromguide5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créé depuis le Guide d'Intégration`)
};

const ar_developerportal_integrationguide_apitokens_createdfromguide5 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Createdfromguide5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم الإنشاء من دليل التكامل`)
};

/**
* | output |
* | --- |
* | "Created from Integration Guide" |
*
* @param {Developerportal_Integrationguide_Apitokens_Createdfromguide5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_apitokens_createdfromguide5 = /** @type {((inputs?: Developerportal_Integrationguide_Apitokens_Createdfromguide5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Apitokens_Createdfromguide5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_apitokens_createdfromguide5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_apitokens_createdfromguide5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_apitokens_createdfromguide5(inputs)
	return ar_developerportal_integrationguide_apitokens_createdfromguide5(inputs)
});
export { developerportal_integrationguide_apitokens_createdfromguide5 as "developerPortal.integrationGuide.apiTokens.createdFromGuide" }