/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Tip13Inputs */

const en_developerportal_components_appdetailsstep_tip13 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use a clear, recognizable app icon (512x512px recommended)`)
};

const es_developerportal_components_appdetailsstep_tip13 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use a clear, recognizable app icon (512x512px recommended)`)
};

const fr_developerportal_components_appdetailsstep_tip13 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use a clear, recognizable app icon (512x512px recommended)`)
};

const ar_developerportal_components_appdetailsstep_tip13 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use a clear, recognizable app icon (512x512px recommended)`)
};

/**
* | output |
* | --- |
* | "Use a clear, recognizable app icon (512x512px recommended)" |
*
* @param {Developerportal_Components_Appdetailsstep_Tip13Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_tip13 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Tip13Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Tip13Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_tip13(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_tip13(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_tip13(inputs)
	return ar_developerportal_components_appdetailsstep_tip13(inputs)
});
export { developerportal_components_appdetailsstep_tip13 as "developerPortal.components.appDetailsStep.tip1" }