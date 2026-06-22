/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Optional3Inputs */

const en_developerportal_components_appdetailsstep_optional3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Optional3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(optional)`)
};

const es_developerportal_components_appdetailsstep_optional3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Optional3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(opcional)`)
};

const fr_developerportal_components_appdetailsstep_optional3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Optional3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(optionnel)`)
};

const ar_developerportal_components_appdetailsstep_optional3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Optional3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(اختياري)`)
};

/**
* | output |
* | --- |
* | "(optional)" |
*
* @param {Developerportal_Components_Appdetailsstep_Optional3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_optional3 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Optional3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Optional3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_optional3(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_optional3(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_optional3(inputs)
	return ar_developerportal_components_appdetailsstep_optional3(inputs)
});
export { developerportal_components_appdetailsstep_optional3 as "developerPortal.components.appDetailsStep.optional" }