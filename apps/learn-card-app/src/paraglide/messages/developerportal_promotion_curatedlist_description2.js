/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Promotion_Curatedlist_Description2Inputs */

const en_developerportal_promotion_curatedlist_description2 = /** @type {(inputs: Developerportal_Promotion_Curatedlist_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Included in curated collections`)
};

const es_developerportal_promotion_curatedlist_description2 = /** @type {(inputs: Developerportal_Promotion_Curatedlist_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Included in curated collections`)
};

const fr_developerportal_promotion_curatedlist_description2 = /** @type {(inputs: Developerportal_Promotion_Curatedlist_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Included in curated collections`)
};

const ar_developerportal_promotion_curatedlist_description2 = /** @type {(inputs: Developerportal_Promotion_Curatedlist_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Included in curated collections`)
};

/**
* | output |
* | --- |
* | "Included in curated collections" |
*
* @param {Developerportal_Promotion_Curatedlist_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_promotion_curatedlist_description2 = /** @type {((inputs?: Developerportal_Promotion_Curatedlist_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Promotion_Curatedlist_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_promotion_curatedlist_description2(inputs)
	if (locale === "es") return es_developerportal_promotion_curatedlist_description2(inputs)
	if (locale === "fr") return fr_developerportal_promotion_curatedlist_description2(inputs)
	return ar_developerportal_promotion_curatedlist_description2(inputs)
});
export { developerportal_promotion_curatedlist_description2 as "developerPortal.promotion.curatedList.description" }