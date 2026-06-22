/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_CategoryInputs */

const en_launchpad_detail_category = /** @type {(inputs: Launchpad_Detail_CategoryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Category`)
};

const es_launchpad_detail_category = /** @type {(inputs: Launchpad_Detail_CategoryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Categoría`)
};

const fr_launchpad_detail_category = /** @type {(inputs: Launchpad_Detail_CategoryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Catégorie`)
};

const ar_launchpad_detail_category = /** @type {(inputs: Launchpad_Detail_CategoryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الفئة`)
};

/**
* | output |
* | --- |
* | "Category" |
*
* @param {Launchpad_Detail_CategoryInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_category = /** @type {((inputs?: Launchpad_Detail_CategoryInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_CategoryInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_category(inputs)
	if (locale === "es") return es_launchpad_detail_category(inputs)
	if (locale === "fr") return fr_launchpad_detail_category(inputs)
	return ar_launchpad_detail_category(inputs)
});
export { launchpad_detail_category as "launchpad.detail.category" }