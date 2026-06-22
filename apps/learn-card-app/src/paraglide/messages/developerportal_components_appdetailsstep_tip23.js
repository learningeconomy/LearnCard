/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Tip23Inputs */

const en_developerportal_components_appdetailsstep_tip23 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keep your tagline concise and action-oriented`)
};

const es_developerportal_components_appdetailsstep_tip23 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keep your tagline concise and action-oriented`)
};

const fr_developerportal_components_appdetailsstep_tip23 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keep your tagline concise and action-oriented`)
};

const ar_developerportal_components_appdetailsstep_tip23 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keep your tagline concise and action-oriented`)
};

/**
* | output |
* | --- |
* | "Keep your tagline concise and action-oriented" |
*
* @param {Developerportal_Components_Appdetailsstep_Tip23Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_tip23 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Tip23Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Tip23Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_tip23(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_tip23(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_tip23(inputs)
	return ar_developerportal_components_appdetailsstep_tip23(inputs)
});
export { developerportal_components_appdetailsstep_tip23 as "developerPortal.components.appDetailsStep.tip2" }