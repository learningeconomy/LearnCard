/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Selectcategory4Inputs */

const en_developerportal_components_appdetailsstep_selectcategory4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Selectcategory4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a category`)
};

const es_developerportal_components_appdetailsstep_selectcategory4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Selectcategory4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar una categoría`)
};

const fr_developerportal_components_appdetailsstep_selectcategory4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Selectcategory4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner une catégorie`)
};

const ar_developerportal_components_appdetailsstep_selectcategory4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Selectcategory4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر تصنيفاً`)
};

/**
* | output |
* | --- |
* | "Select a category" |
*
* @param {Developerportal_Components_Appdetailsstep_Selectcategory4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_selectcategory4 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Selectcategory4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Selectcategory4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_selectcategory4(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_selectcategory4(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_selectcategory4(inputs)
	return ar_developerportal_components_appdetailsstep_selectcategory4(inputs)
});
export { developerportal_components_appdetailsstep_selectcategory4 as "developerPortal.components.appDetailsStep.selectCategory" }