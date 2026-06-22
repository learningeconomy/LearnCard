/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Highlights3Inputs */

const en_developerportal_components_appdetailsstep_highlights3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Highlights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Highlights`)
};

const es_developerportal_components_appdetailsstep_highlights3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Highlights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destacados`)
};

const fr_developerportal_components_appdetailsstep_highlights3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Highlights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Points Forts`)
};

const ar_developerportal_components_appdetailsstep_highlights3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Highlights3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أبرز الميزات`)
};

/**
* | output |
* | --- |
* | "Highlights" |
*
* @param {Developerportal_Components_Appdetailsstep_Highlights3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_highlights3 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Highlights3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Highlights3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_highlights3(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_highlights3(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_highlights3(inputs)
	return ar_developerportal_components_appdetailsstep_highlights3(inputs)
});
export { developerportal_components_appdetailsstep_highlights3 as "developerPortal.components.appDetailsStep.highlights" }