/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Methods_Launchfeature_Tip34Inputs */

const en_developerportal_guides_embedapp_apireference_methods_launchfeature_tip34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Launchfeature_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Navigation happens within the wallet, not your iframe`)
};

const es_developerportal_guides_embedapp_apireference_methods_launchfeature_tip34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Launchfeature_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La navegación ocurre dentro de la cartera, no en tu iframe`)
};

const fr_developerportal_guides_embedapp_apireference_methods_launchfeature_tip34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Launchfeature_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La navigation se produit dans le portefeuille, pas dans votre iframe`)
};

const ar_developerportal_guides_embedapp_apireference_methods_launchfeature_tip34 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Launchfeature_Tip34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يحدث التنقل داخل المحفظة، وليس في iframe الخاص بك`)
};

/**
* | output |
* | --- |
* | "Navigation happens within the wallet, not your iframe" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Methods_Launchfeature_Tip34Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_methods_launchfeature_tip34 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Methods_Launchfeature_Tip34Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Methods_Launchfeature_Tip34Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_methods_launchfeature_tip34(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_methods_launchfeature_tip34(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_methods_launchfeature_tip34(inputs)
	return ar_developerportal_guides_embedapp_apireference_methods_launchfeature_tip34(inputs)
});
export { developerportal_guides_embedapp_apireference_methods_launchfeature_tip34 as "developerPortal.guides.embedApp.apiReference.methods.launchFeature.tip3" }