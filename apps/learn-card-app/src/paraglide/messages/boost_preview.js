/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_PreviewInputs */

const en_boost_preview = /** @type {(inputs: Boost_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview`)
};

const es_boost_preview = /** @type {(inputs: Boost_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista previa`)
};

const de_boost_preview = /** @type {(inputs: Boost_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vorschau`)
};

const ar_boost_preview = /** @type {(inputs: Boost_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة`)
};

const fr_boost_preview = /** @type {(inputs: Boost_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu`)
};

const ko_boost_preview = /** @type {(inputs: Boost_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`미리보기`)
};

/**
* | output |
* | --- |
* | "Preview" |
*
* @param {Boost_PreviewInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_preview = /** @type {((inputs?: Boost_PreviewInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_PreviewInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_preview(inputs)
	if (locale === "es") return es_boost_preview(inputs)
	if (locale === "de") return de_boost_preview(inputs)
	if (locale === "ar") return ar_boost_preview(inputs)
	if (locale === "fr") return fr_boost_preview(inputs)
	return ko_boost_preview(inputs)
});
export { boost_preview as "boost.preview" }