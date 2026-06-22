/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Legalprivacy4Inputs */

const en_developerportal_components_appdetailsstep_legalprivacy4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Legalprivacy4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Legal & Privacy`)
};

const es_developerportal_components_appdetailsstep_legalprivacy4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Legalprivacy4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Legal y Privacidad`)
};

const fr_developerportal_components_appdetailsstep_legalprivacy4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Legalprivacy4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mentions Légales et Confidentialité`)
};

const ar_developerportal_components_appdetailsstep_legalprivacy4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Legalprivacy4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`القانونية والخصوصية`)
};

/**
* | output |
* | --- |
* | "Legal & Privacy" |
*
* @param {Developerportal_Components_Appdetailsstep_Legalprivacy4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_legalprivacy4 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Legalprivacy4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Legalprivacy4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_legalprivacy4(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_legalprivacy4(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_legalprivacy4(inputs)
	return ar_developerportal_components_appdetailsstep_legalprivacy4(inputs)
});
export { developerportal_components_appdetailsstep_legalprivacy4 as "developerPortal.components.appDetailsStep.legalPrivacy" }