/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Promotion_Curatedlist_Label2Inputs */

const en_developerportal_promotion_curatedlist_label2 = /** @type {(inputs: Developerportal_Promotion_Curatedlist_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Curated List`)
};

const es_developerportal_promotion_curatedlist_label2 = /** @type {(inputs: Developerportal_Promotion_Curatedlist_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Curated List`)
};

const fr_developerportal_promotion_curatedlist_label2 = /** @type {(inputs: Developerportal_Promotion_Curatedlist_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Curated List`)
};

const ar_developerportal_promotion_curatedlist_label2 = /** @type {(inputs: Developerportal_Promotion_Curatedlist_Label2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Curated List`)
};

/**
* | output |
* | --- |
* | "Curated List" |
*
* @param {Developerportal_Promotion_Curatedlist_Label2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_promotion_curatedlist_label2 = /** @type {((inputs?: Developerportal_Promotion_Curatedlist_Label2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Promotion_Curatedlist_Label2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_promotion_curatedlist_label2(inputs)
	if (locale === "es") return es_developerportal_promotion_curatedlist_label2(inputs)
	if (locale === "fr") return fr_developerportal_promotion_curatedlist_label2(inputs)
	return ar_developerportal_promotion_curatedlist_label2(inputs)
});
export { developerportal_promotion_curatedlist_label2 as "developerPortal.promotion.curatedList.label" }