/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Tipsforgreatlisting6Inputs */

const en_developerportal_components_appdetailsstep_tipsforgreatlisting6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tipsforgreatlisting6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tips for a great listing`)
};

const es_developerportal_components_appdetailsstep_tipsforgreatlisting6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tipsforgreatlisting6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consejos para un listado excelente`)
};

const fr_developerportal_components_appdetailsstep_tipsforgreatlisting6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tipsforgreatlisting6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conseils pour une excellente annonce`)
};

const ar_developerportal_components_appdetailsstep_tipsforgreatlisting6 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Tipsforgreatlisting6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نصائح لقائمة ممتازة`)
};

/**
* | output |
* | --- |
* | "Tips for a great listing" |
*
* @param {Developerportal_Components_Appdetailsstep_Tipsforgreatlisting6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_tipsforgreatlisting6 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Tipsforgreatlisting6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Tipsforgreatlisting6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_tipsforgreatlisting6(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_tipsforgreatlisting6(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_tipsforgreatlisting6(inputs)
	return ar_developerportal_components_appdetailsstep_tipsforgreatlisting6(inputs)
});
export { developerportal_components_appdetailsstep_tipsforgreatlisting6 as "developerPortal.components.appDetailsStep.tipsForGreatListing" }