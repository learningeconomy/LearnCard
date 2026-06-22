/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Ageratingplaceholder5Inputs */

const en_developerportal_components_appdetailsstep_ageratingplaceholder5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Ageratingplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., 13`)
};

const es_developerportal_components_appdetailsstep_ageratingplaceholder5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Ageratingplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., 13`)
};

const fr_developerportal_components_appdetailsstep_ageratingplaceholder5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Ageratingplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., 13`)
};

const ar_developerportal_components_appdetailsstep_ageratingplaceholder5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Ageratingplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: 13`)
};

/**
* | output |
* | --- |
* | "e.g., 13" |
*
* @param {Developerportal_Components_Appdetailsstep_Ageratingplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_ageratingplaceholder5 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Ageratingplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Ageratingplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_ageratingplaceholder5(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_ageratingplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_ageratingplaceholder5(inputs)
	return ar_developerportal_components_appdetailsstep_ageratingplaceholder5(inputs)
});
export { developerportal_components_appdetailsstep_ageratingplaceholder5 as "developerPortal.components.appDetailsStep.ageRatingPlaceholder" }