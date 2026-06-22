/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Title3Inputs */

const en_developerportal_components_appdetailsstep_title3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Information`)
};

const es_developerportal_components_appdetailsstep_title3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Información de la Aplicación`)
};

const fr_developerportal_components_appdetailsstep_title3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Informations de l'Application`)
};

const ar_developerportal_components_appdetailsstep_title3 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معلومات التطبيق`)
};

/**
* | output |
* | --- |
* | "App Information" |
*
* @param {Developerportal_Components_Appdetailsstep_Title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_title3 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_title3(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_title3(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_title3(inputs)
	return ar_developerportal_components_appdetailsstep_title3(inputs)
});
export { developerportal_components_appdetailsstep_title3 as "developerPortal.components.appDetailsStep.title" }