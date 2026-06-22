/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Completeintegrationcode5Inputs */

const en_developerportal_guides_embedapp_yourapp_completeintegrationcode5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Completeintegrationcode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete Integration Code`)
};

const es_developerportal_guides_embedapp_yourapp_completeintegrationcode5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Completeintegrationcode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete Código de Integración`)
};

const fr_developerportal_guides_embedapp_yourapp_completeintegrationcode5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Completeintegrationcode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete Code d'Intégration`)
};

const ar_developerportal_guides_embedapp_yourapp_completeintegrationcode5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Completeintegrationcode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete رمز التكامل`)
};

/**
* | output |
* | --- |
* | "Complete Integration Code" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Completeintegrationcode5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_completeintegrationcode5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Completeintegrationcode5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Completeintegrationcode5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_completeintegrationcode5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_completeintegrationcode5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_completeintegrationcode5(inputs)
	return ar_developerportal_guides_embedapp_yourapp_completeintegrationcode5(inputs)
});
export { developerportal_guides_embedapp_yourapp_completeintegrationcode5 as "developerPortal.guides.embedApp.yourApp.completeIntegrationCode" }