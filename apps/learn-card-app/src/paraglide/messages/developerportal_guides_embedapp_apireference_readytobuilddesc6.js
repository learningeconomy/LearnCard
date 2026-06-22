/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Readytobuilddesc6Inputs */

const en_developerportal_guides_embedapp_apireference_readytobuilddesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Readytobuilddesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You now have everything you need to build a powerful embedded LearnCard app. Check out the full documentation for advanced features and best practices.`)
};

const es_developerportal_guides_embedapp_apireference_readytobuilddesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Readytobuilddesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You now have everything you need to build a powerful embedded LearnCard app. Verificar out the full documentation for advanced features and best practices.`)
};

const fr_developerportal_guides_embedapp_apireference_readytobuilddesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Readytobuilddesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You now have everything you need to build a powerful embedded LearnCard app. Vérifier out the full documentation for advanced features and best practices.`)
};

const ar_developerportal_guides_embedapp_apireference_readytobuilddesc6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Readytobuilddesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You now have everything you need to build a powerful embedded LearnCard app. تحقق out the full documentation for advanced features and best practices.`)
};

/**
* | output |
* | --- |
* | "You now have everything you need to build a powerful embedded LearnCard app. Check out the full documentation for advanced features and best practices." |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Readytobuilddesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_readytobuilddesc6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Readytobuilddesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Readytobuilddesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_readytobuilddesc6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_readytobuilddesc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_readytobuilddesc6(inputs)
	return ar_developerportal_guides_embedapp_apireference_readytobuilddesc6(inputs)
});
export { developerportal_guides_embedapp_apireference_readytobuilddesc6 as "developerPortal.guides.embedApp.apiReference.readyToBuildDesc" }