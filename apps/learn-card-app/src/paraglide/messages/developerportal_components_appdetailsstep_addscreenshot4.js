/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Addscreenshot4Inputs */

const en_developerportal_components_appdetailsstep_addscreenshot4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Addscreenshot4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add screenshot`)
};

const es_developerportal_components_appdetailsstep_addscreenshot4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Addscreenshot4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir captura`)
};

const fr_developerportal_components_appdetailsstep_addscreenshot4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Addscreenshot4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter une capture`)
};

const ar_developerportal_components_appdetailsstep_addscreenshot4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Addscreenshot4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة لقطة شاشة`)
};

/**
* | output |
* | --- |
* | "Add screenshot" |
*
* @param {Developerportal_Components_Appdetailsstep_Addscreenshot4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_addscreenshot4 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Addscreenshot4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Addscreenshot4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_addscreenshot4(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_addscreenshot4(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_addscreenshot4(inputs)
	return ar_developerportal_components_appdetailsstep_addscreenshot4(inputs)
});
export { developerportal_components_appdetailsstep_addscreenshot4 as "developerPortal.components.appDetailsStep.addScreenshot" }