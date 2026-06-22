/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Promovideourl5Inputs */

const en_developerportal_components_appdetailsstep_promovideourl5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Promovideourl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Promo Video URL`)
};

const es_developerportal_components_appdetailsstep_promovideourl5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Promovideourl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de Video Promocional`)
};

const fr_developerportal_components_appdetailsstep_promovideourl5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Promovideourl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de la Vidéo Promo`)
};

const ar_developerportal_components_appdetailsstep_promovideourl5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Promovideourl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط الفيديو الترويجي`)
};

/**
* | output |
* | --- |
* | "Promo Video URL" |
*
* @param {Developerportal_Components_Appdetailsstep_Promovideourl5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_promovideourl5 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Promovideourl5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Promovideourl5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_promovideourl5(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_promovideourl5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_promovideourl5(inputs)
	return ar_developerportal_components_appdetailsstep_promovideourl5(inputs)
});
export { developerportal_components_appdetailsstep_promovideourl5 as "developerPortal.components.appDetailsStep.promoVideoUrl" }