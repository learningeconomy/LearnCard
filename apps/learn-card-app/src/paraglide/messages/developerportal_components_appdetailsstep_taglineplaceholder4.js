/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Taglineplaceholder4Inputs */

const en_developerportal_components_appdetailsstep_taglineplaceholder4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Taglineplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A short, catchy description of your app`)
};

const es_developerportal_components_appdetailsstep_taglineplaceholder4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Taglineplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Una descripción corta y llamativa de tu aplicación`)
};

const fr_developerportal_components_appdetailsstep_taglineplaceholder4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Taglineplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une description courte et accrocheuse de votre application`)
};

const ar_developerportal_components_appdetailsstep_taglineplaceholder4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Taglineplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصف قصير وجذاب لتطبيقك`)
};

/**
* | output |
* | --- |
* | "A short, catchy description of your app" |
*
* @param {Developerportal_Components_Appdetailsstep_Taglineplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_taglineplaceholder4 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Taglineplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Taglineplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_taglineplaceholder4(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_taglineplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_taglineplaceholder4(inputs)
	return ar_developerportal_components_appdetailsstep_taglineplaceholder4(inputs)
});
export { developerportal_components_appdetailsstep_taglineplaceholder4 as "developerPortal.components.appDetailsStep.taglinePlaceholder" }