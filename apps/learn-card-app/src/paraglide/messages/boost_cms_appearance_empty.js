/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_EmptyInputs */

const en_boost_cms_appearance_empty = /** @type {(inputs: Boost_Cms_Appearance_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Empty`)
};

const es_boost_cms_appearance_empty = /** @type {(inputs: Boost_Cms_Appearance_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vacío`)
};

const fr_boost_cms_appearance_empty = /** @type {(inputs: Boost_Cms_Appearance_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vide`)
};

const ar_boost_cms_appearance_empty = /** @type {(inputs: Boost_Cms_Appearance_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فارغ`)
};

/**
* | output |
* | --- |
* | "Empty" |
*
* @param {Boost_Cms_Appearance_EmptyInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_empty = /** @type {((inputs?: Boost_Cms_Appearance_EmptyInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_EmptyInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_empty(inputs)
	if (locale === "es") return es_boost_cms_appearance_empty(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_empty(inputs)
	return ar_boost_cms_appearance_empty(inputs)
});
export { boost_cms_appearance_empty as "boost.cms.appearance.empty" }