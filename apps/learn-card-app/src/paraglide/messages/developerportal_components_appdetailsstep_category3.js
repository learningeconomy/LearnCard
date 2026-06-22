/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Category3Inputs */

const en_developerportal_components_appdetailsstep_category3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Category3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Category`)
};

const es_developerportal_components_appdetailsstep_category3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Category3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Categoría`)
};

const fr_developerportal_components_appdetailsstep_category3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Category3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Catégorie`)
};

const ar_developerportal_components_appdetailsstep_category3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Category3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التصنيف`)
};

/**
* | output |
* | --- |
* | "Category" |
*
* @param {Developerportal_Components_Appdetailsstep_Category3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_category3 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Category3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Category3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_category3(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_category3(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_category3(inputs)
	return ar_developerportal_components_appdetailsstep_category3(inputs)
});
export { developerportal_components_appdetailsstep_category3 as "developerPortal.components.appDetailsStep.category" }