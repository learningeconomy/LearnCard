/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Norating4Inputs */

const en_developerportal_components_appdetailsstep_norating4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Norating4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No rating`)
};

const es_developerportal_components_appdetailsstep_norating4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Norating4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin clasificación`)
};

const fr_developerportal_components_appdetailsstep_norating4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Norating4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune classification`)
};

const ar_developerportal_components_appdetailsstep_norating4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Norating4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بدون تصنيف`)
};

/**
* | output |
* | --- |
* | "No rating" |
*
* @param {Developerportal_Components_Appdetailsstep_Norating4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_norating4 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Norating4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Norating4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_norating4(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_norating4(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_norating4(inputs)
	return ar_developerportal_components_appdetailsstep_norating4(inputs)
});
export { developerportal_components_appdetailsstep_norating4 as "developerPortal.components.appDetailsStep.noRating" }