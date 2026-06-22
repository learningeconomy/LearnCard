/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Highlightplaceholder4Inputs */

const en_developerportal_components_appdetailsstep_highlightplaceholder4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Highlightplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., All your learning stored in one place`)
};

const es_developerportal_components_appdetailsstep_highlightplaceholder4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Highlightplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Todo tu aprendizaje almacenado en un lugar`)
};

const fr_developerportal_components_appdetailsstep_highlightplaceholder4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Highlightplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., Tout votre apprentissage stocké au même endroit`)
};

const ar_developerportal_components_appdetailsstep_highlightplaceholder4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Highlightplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: كل تعلمك مخزن في مكان واحد`)
};

/**
* | output |
* | --- |
* | "e.g., All your learning stored in one place" |
*
* @param {Developerportal_Components_Appdetailsstep_Highlightplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_highlightplaceholder4 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Highlightplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Highlightplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_highlightplaceholder4(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_highlightplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_highlightplaceholder4(inputs)
	return ar_developerportal_components_appdetailsstep_highlightplaceholder4(inputs)
});
export { developerportal_components_appdetailsstep_highlightplaceholder4 as "developerPortal.components.appDetailsStep.highlightPlaceholder" }