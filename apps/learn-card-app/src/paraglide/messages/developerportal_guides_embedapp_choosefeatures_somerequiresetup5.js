/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Choosefeatures_Somerequiresetup5Inputs */

const en_developerportal_guides_embedapp_choosefeatures_somerequiresetup5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Somerequiresetup5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Some features require additional setup. We'll guide you through it.`)
};

const es_developerportal_guides_embedapp_choosefeatures_somerequiresetup5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Somerequiresetup5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Some features require additional setup. We'll guide you through it.`)
};

const fr_developerportal_guides_embedapp_choosefeatures_somerequiresetup5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Somerequiresetup5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Some features require additional setup. We'll guide you through it.`)
};

const ar_developerportal_guides_embedapp_choosefeatures_somerequiresetup5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Somerequiresetup5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Some features require additional setup. We'll guide you through it.`)
};

/**
* | output |
* | --- |
* | "Some features require additional setup. We'll guide you through it." |
*
* @param {Developerportal_Guides_Embedapp_Choosefeatures_Somerequiresetup5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_choosefeatures_somerequiresetup5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Choosefeatures_Somerequiresetup5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Choosefeatures_Somerequiresetup5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_choosefeatures_somerequiresetup5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_choosefeatures_somerequiresetup5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_choosefeatures_somerequiresetup5(inputs)
	return ar_developerportal_guides_embedapp_choosefeatures_somerequiresetup5(inputs)
});
export { developerportal_guides_embedapp_choosefeatures_somerequiresetup5 as "developerPortal.guides.embedApp.chooseFeatures.someRequireSetup" }