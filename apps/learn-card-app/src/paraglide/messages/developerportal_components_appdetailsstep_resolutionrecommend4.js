/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Resolutionrecommend4Inputs */

const en_developerportal_components_appdetailsstep_resolutionrecommend4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Resolutionrecommend4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`512×512px recommended`)
};

const es_developerportal_components_appdetailsstep_resolutionrecommend4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Resolutionrecommend4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`512×512px recomendado`)
};

const fr_developerportal_components_appdetailsstep_resolutionrecommend4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Resolutionrecommend4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`512×512px recommandé`)
};

const ar_developerportal_components_appdetailsstep_resolutionrecommend4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Resolutionrecommend4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`512×512 بكسل موصى به`)
};

/**
* | output |
* | --- |
* | "512×512px recommended" |
*
* @param {Developerportal_Components_Appdetailsstep_Resolutionrecommend4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_resolutionrecommend4 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Resolutionrecommend4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Resolutionrecommend4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_resolutionrecommend4(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_resolutionrecommend4(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_resolutionrecommend4(inputs)
	return ar_developerportal_components_appdetailsstep_resolutionrecommend4(inputs)
});
export { developerportal_components_appdetailsstep_resolutionrecommend4 as "developerPortal.components.appDetailsStep.resolutionRecommend" }