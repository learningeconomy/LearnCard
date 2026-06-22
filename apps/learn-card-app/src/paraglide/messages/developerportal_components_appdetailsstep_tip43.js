/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Tip43Inputs */

const en_developerportal_components_appdetailsstep_tip43 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add 3-5 highlights explaining your app's value`)
};

const es_developerportal_components_appdetailsstep_tip43 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add 3-5 highlights explaining your app's value`)
};

const fr_developerportal_components_appdetailsstep_tip43 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add 3-5 highlights explaining your app's value`)
};

const ar_developerportal_components_appdetailsstep_tip43 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tip43Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add 3-5 highlights explaining your app's value`)
};

/**
* | output |
* | --- |
* | "Add 3-5 highlights explaining your app's value" |
*
* @param {Developerportal_Components_Appdetailsstep_Tip43Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_tip43 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Tip43Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Tip43Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_tip43(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_tip43(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_tip43(inputs)
	return ar_developerportal_components_appdetailsstep_tip43(inputs)
});
export { developerportal_components_appdetailsstep_tip43 as "developerPortal.components.appDetailsStep.tip4" }