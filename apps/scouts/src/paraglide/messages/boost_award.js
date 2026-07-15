/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_AwardInputs */

const en_boost_award = /** @type {(inputs: Boost_AwardInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Award`)
};

const es_boost_award = /** @type {(inputs: Boost_AwardInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Otorgar`)
};

const fr_boost_award = /** @type {(inputs: Boost_AwardInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Décerner`)
};

const ar_boost_award = /** @type {(inputs: Boost_AwardInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منح`)
};

/**
* | output |
* | --- |
* | "Award" |
*
* @param {Boost_AwardInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_award = /** @type {((inputs?: Boost_AwardInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_AwardInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_award(inputs)
	if (locale === "es") return es_boost_award(inputs)
	if (locale === "fr") return fr_boost_award(inputs)
	return ar_boost_award(inputs)
});
export { boost_award as "boost.award" }