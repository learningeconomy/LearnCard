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

const fr_boost_draft = /** @type {(inputs: Boost_DraftInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Brouillon`)
};

const ar_boost_draft = /** @type {(inputs: Boost_DraftInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسودة`)
};

/**
* | output |
* | --- |
* | "Draft" |
*
* @param {Boost_DraftInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_draft = /** @type {((inputs?: Boost_DraftInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_DraftInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_draft(inputs)
	if (locale === "es") return es_boost_draft(inputs)
	if (locale === "fr") return fr_boost_draft(inputs)
	return ar_boost_draft(inputs)
});
export { boost_draft as "boost.draft" }