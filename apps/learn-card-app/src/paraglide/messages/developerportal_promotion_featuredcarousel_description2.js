/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Promotion_Featuredcarousel_Description2Inputs */

const en_developerportal_promotion_featuredcarousel_description2 = /** @type {(inputs: Developerportal_Promotion_Featuredcarousel_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prominently displayed in the featured section`)
};

const es_developerportal_promotion_featuredcarousel_description2 = /** @type {(inputs: Developerportal_Promotion_Featuredcarousel_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prominently displayed in the featured section`)
};

const fr_developerportal_promotion_featuredcarousel_description2 = /** @type {(inputs: Developerportal_Promotion_Featuredcarousel_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prominently displayed in the featured section`)
};

const ar_developerportal_promotion_featuredcarousel_description2 = /** @type {(inputs: Developerportal_Promotion_Featuredcarousel_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prominently displayed in the featured section`)
};

/**
* | output |
* | --- |
* | "Prominently displayed in the featured section" |
*
* @param {Developerportal_Promotion_Featuredcarousel_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_promotion_featuredcarousel_description2 = /** @type {((inputs?: Developerportal_Promotion_Featuredcarousel_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Promotion_Featuredcarousel_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_promotion_featuredcarousel_description2(inputs)
	if (locale === "es") return es_developerportal_promotion_featuredcarousel_description2(inputs)
	if (locale === "fr") return fr_developerportal_promotion_featuredcarousel_description2(inputs)
	return ar_developerportal_promotion_featuredcarousel_description2(inputs)
});
export { developerportal_promotion_featuredcarousel_description2 as "developerPortal.promotion.featuredCarousel.description" }