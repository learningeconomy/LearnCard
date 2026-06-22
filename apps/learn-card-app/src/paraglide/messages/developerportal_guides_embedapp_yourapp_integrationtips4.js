/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Integrationtips4Inputs */

const en_developerportal_guides_embedapp_yourapp_integrationtips4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Integrationtips4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration Tips`)
};

const es_developerportal_guides_embedapp_yourapp_integrationtips4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Integrationtips4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consejos de Integración`)
};

const fr_developerportal_guides_embedapp_yourapp_integrationtips4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Integrationtips4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conseils d'Intégration`)
};

const ar_developerportal_guides_embedapp_yourapp_integrationtips4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Integrationtips4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration نصائح`)
};

/**
* | output |
* | --- |
* | "Integration Tips" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Integrationtips4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_integrationtips4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Integrationtips4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Integrationtips4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_integrationtips4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_integrationtips4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_integrationtips4(inputs)
	return ar_developerportal_guides_embedapp_yourapp_integrationtips4(inputs)
});
export { developerportal_guides_embedapp_yourapp_integrationtips4 as "developerPortal.guides.embedApp.yourApp.integrationTips" }