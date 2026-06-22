/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Promovideoplaceholder5Inputs */

const en_developerportal_components_appdetailsstep_promovideoplaceholder5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Promovideoplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://youtube.com/watch?v=...`)
};

const es_developerportal_components_appdetailsstep_promovideoplaceholder5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Promovideoplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://youtube.com/watch?v=...`)
};

const fr_developerportal_components_appdetailsstep_promovideoplaceholder5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Promovideoplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://youtube.com/watch?v=...`)
};

const ar_developerportal_components_appdetailsstep_promovideoplaceholder5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Promovideoplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://youtube.com/watch?v=...`)
};

/**
* | output |
* | --- |
* | "https://youtube.com/watch?v=..." |
*
* @param {Developerportal_Components_Appdetailsstep_Promovideoplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_promovideoplaceholder5 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Promovideoplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Promovideoplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_promovideoplaceholder5(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_promovideoplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_promovideoplaceholder5(inputs)
	return ar_developerportal_components_appdetailsstep_promovideoplaceholder5(inputs)
});
export { developerportal_components_appdetailsstep_promovideoplaceholder5 as "developerPortal.components.appDetailsStep.promoVideoPlaceholder" }