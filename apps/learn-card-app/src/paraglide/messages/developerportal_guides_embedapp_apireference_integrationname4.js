/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Integrationname4Inputs */

const en_developerportal_guides_embedapp_apireference_integrationname4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Integrationname4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration name`)
};

const es_developerportal_guides_embedapp_apireference_integrationname4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Integrationname4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de integración`)
};

const fr_developerportal_guides_embedapp_apireference_integrationname4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Integrationname4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom de l'intégration`)
};

const ar_developerportal_guides_embedapp_apireference_integrationname4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Integrationname4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم التكامل`)
};

/**
* | output |
* | --- |
* | "Integration name" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Integrationname4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_integrationname4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Integrationname4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Integrationname4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_integrationname4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_integrationname4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_integrationname4(inputs)
	return ar_developerportal_guides_embedapp_apireference_integrationname4(inputs)
});
export { developerportal_guides_embedapp_apireference_integrationname4 as "developerPortal.guides.embedApp.apiReference.integrationName" }