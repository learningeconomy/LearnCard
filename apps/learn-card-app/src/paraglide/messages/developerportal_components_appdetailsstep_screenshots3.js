/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Screenshots3Inputs */

const en_developerportal_components_appdetailsstep_screenshots3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Screenshots3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Screenshots`)
};

const es_developerportal_components_appdetailsstep_screenshots3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Screenshots3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Capturas de Pantalla`)
};

const fr_developerportal_components_appdetailsstep_screenshots3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Screenshots3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Captures d'Écran`)
};

const ar_developerportal_components_appdetailsstep_screenshots3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Screenshots3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقطات الشاشة`)
};

/**
* | output |
* | --- |
* | "Screenshots" |
*
* @param {Developerportal_Components_Appdetailsstep_Screenshots3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_screenshots3 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Screenshots3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Screenshots3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_screenshots3(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_screenshots3(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_screenshots3(inputs)
	return ar_developerportal_components_appdetailsstep_screenshots3(inputs)
});
export { developerportal_components_appdetailsstep_screenshots3 as "developerPortal.components.appDetailsStep.screenshots" }