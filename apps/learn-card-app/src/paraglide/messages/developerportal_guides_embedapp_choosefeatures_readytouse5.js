/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Choosefeatures_Readytouse5Inputs */

const en_developerportal_guides_embedapp_choosefeatures_readytouse5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Readytouse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ready to use`)
};

const es_developerportal_guides_embedapp_choosefeatures_readytouse5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Readytouse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listo para usar`)
};

const fr_developerportal_guides_embedapp_choosefeatures_readytouse5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Readytouse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prêt à l'emploi`)
};

const ar_developerportal_guides_embedapp_choosefeatures_readytouse5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Readytouse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاهز للاستخدام`)
};

/**
* | output |
* | --- |
* | "Ready to use" |
*
* @param {Developerportal_Guides_Embedapp_Choosefeatures_Readytouse5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_choosefeatures_readytouse5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Choosefeatures_Readytouse5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Choosefeatures_Readytouse5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_choosefeatures_readytouse5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_choosefeatures_readytouse5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_choosefeatures_readytouse5(inputs)
	return ar_developerportal_guides_embedapp_choosefeatures_readytouse5(inputs)
});
export { developerportal_guides_embedapp_choosefeatures_readytouse5 as "developerPortal.guides.embedApp.chooseFeatures.readyToUse" }