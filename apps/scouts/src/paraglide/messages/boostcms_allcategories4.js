/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Allcategories4Inputs */

const en_boostcms_allcategories4 = /** @type {(inputs: Boostcms_Allcategories4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All Categories`)
};

const es_boostcms_allcategories4 = /** @type {(inputs: Boostcms_Allcategories4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todas las Categorías`)
};

const fr_boostcms_allcategories4 = /** @type {(inputs: Boostcms_Allcategories4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Toutes les catégories`)
};

const ar_boostcms_allcategories4 = /** @type {(inputs: Boostcms_Allcategories4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جميع الفئات`)
};

/**
* | output |
* | --- |
* | "All Categories" |
*
* @param {Boostcms_Allcategories4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_allcategories4 = /** @type {((inputs?: Boostcms_Allcategories4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Allcategories4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_allcategories4(inputs)
	if (locale === "es") return es_boostcms_allcategories4(inputs)
	if (locale === "fr") return fr_boostcms_allcategories4(inputs)
	return ar_boostcms_allcategories4(inputs)
});
export { boostcms_allcategories4 as "boostCMS.allCategories" }