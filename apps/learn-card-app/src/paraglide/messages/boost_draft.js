/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_DraftInputs */

const en_boost_draft = /** @type {(inputs: Boost_DraftInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Draft`)
};

const es_boost_draft = /** @type {(inputs: Boost_DraftInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Borrador`)
};

const de_boost_draft = /** @type {(inputs: Boost_DraftInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entwurf`)
};

const ar_boost_draft = /** @type {(inputs: Boost_DraftInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسودة`)
};

const fr_boost_draft = /** @type {(inputs: Boost_DraftInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Brouillon`)
};

const ko_boost_draft = /** @type {(inputs: Boost_DraftInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`초안`)
};

/**
* | output |
* | --- |
* | "Draft" |
*
* @param {Boost_DraftInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_draft = /** @type {((inputs?: Boost_DraftInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_DraftInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_draft(inputs)
	if (locale === "es") return es_boost_draft(inputs)
	if (locale === "de") return de_boost_draft(inputs)
	if (locale === "ar") return ar_boost_draft(inputs)
	if (locale === "fr") return fr_boost_draft(inputs)
	return ko_boost_draft(inputs)
});
export { boost_draft as "boost.draft" }