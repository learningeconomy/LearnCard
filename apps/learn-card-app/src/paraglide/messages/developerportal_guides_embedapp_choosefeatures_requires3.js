/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ description: NonNullable<unknown> }} Developerportal_Guides_Embedapp_Choosefeatures_Requires3Inputs */

const en_developerportal_guides_embedapp_choosefeatures_requires3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Requires3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Requires: ${i?.description}`)
};

const es_developerportal_guides_embedapp_choosefeatures_requires3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Requires3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Requiere: ${i?.description}`)
};

const fr_developerportal_guides_embedapp_choosefeatures_requires3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Requires3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Nécessite: ${i?.description}`)
};

const ar_developerportal_guides_embedapp_choosefeatures_requires3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Requires3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`يتطلب: ${i?.description}`)
};

/**
* | output |
* | --- |
* | "Requires: {description}" |
*
* @param {Developerportal_Guides_Embedapp_Choosefeatures_Requires3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_choosefeatures_requires3 = /** @type {((inputs: Developerportal_Guides_Embedapp_Choosefeatures_Requires3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Choosefeatures_Requires3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_choosefeatures_requires3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_choosefeatures_requires3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_choosefeatures_requires3(inputs)
	return ar_developerportal_guides_embedapp_choosefeatures_requires3(inputs)
});
export { developerportal_guides_embedapp_choosefeatures_requires3 as "developerPortal.guides.embedApp.chooseFeatures.requires" }