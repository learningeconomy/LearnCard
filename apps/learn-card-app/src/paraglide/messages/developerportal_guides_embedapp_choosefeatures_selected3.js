/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ n: NonNullable<unknown>, context: NonNullable<unknown>, count: NonNullable<unknown> }} Developerportal_Guides_Embedapp_Choosefeatures_Selected3Inputs */

const en_developerportal_guides_embedapp_choosefeatures_selected3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Selected3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`Selected: ${i?.count} features`);
	return /** @type {LocalizedString} */ (`Selected: ${i?.n} feature`)
	
};

const es_developerportal_guides_embedapp_choosefeatures_selected3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Selected3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`Selected: ${i?.count} features`);
	return /** @type {LocalizedString} */ (`Seleccionadas: ${i?.n} función`)
	
};

const fr_developerportal_guides_embedapp_choosefeatures_selected3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Selected3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`Selected: ${i?.count} features`);
	return /** @type {LocalizedString} */ (`Sélectionnées: ${i?.n} fonctionnalité`)
	
};

const ar_developerportal_guides_embedapp_choosefeatures_selected3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Selected3Inputs) => LocalizedString} */ (i) => {
	if (i?.context === "plural") return /** @type {LocalizedString} */ (`Selected: ${i?.count} features`);
	return /** @type {LocalizedString} */ (`المحددة: ${i?.n} ميزة`)
	
};

/**
* | context | output |
* | --- | --- |
* | "plural" | "Selected: {count} features" |
* | * | "Selected: {n} feature" |
*
* @param {Developerportal_Guides_Embedapp_Choosefeatures_Selected3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_choosefeatures_selected3 = /** @type {((inputs: Developerportal_Guides_Embedapp_Choosefeatures_Selected3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Choosefeatures_Selected3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_choosefeatures_selected3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_choosefeatures_selected3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_choosefeatures_selected3(inputs)
	return ar_developerportal_guides_embedapp_choosefeatures_selected3(inputs)
});
export { developerportal_guides_embedapp_choosefeatures_selected3 as "developerPortal.guides.embedApp.chooseFeatures.selected" }