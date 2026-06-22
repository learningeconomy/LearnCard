/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Selecttemplate4Inputs */

const en_developerportal_guides_embedclaim_teststep_selecttemplate4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Selecttemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select template to preview`)
};

const es_developerportal_guides_embedclaim_teststep_selecttemplate4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Selecttemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar plantilla para previsualizar`)
};

const fr_developerportal_guides_embedclaim_teststep_selecttemplate4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Selecttemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner un modèle à prévisualiser`)
};

const ar_developerportal_guides_embedclaim_teststep_selecttemplate4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Selecttemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر قالباً للمعاينة`)
};

/**
* | output |
* | --- |
* | "Select template to preview" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Selecttemplate4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_selecttemplate4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Selecttemplate4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Selecttemplate4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_selecttemplate4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_selecttemplate4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_selecttemplate4(inputs)
	return ar_developerportal_guides_embedclaim_teststep_selecttemplate4(inputs)
});
export { developerportal_guides_embedclaim_teststep_selecttemplate4 as "developerPortal.guides.embedClaim.testStep.selectTemplate" }