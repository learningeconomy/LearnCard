/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Scoutmemberone2Inputs */

const en_boost_scoutmemberone2 = /** @type {(inputs: Boost_Scoutmemberone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

const es_boost_scoutmemberone2 = /** @type {(inputs: Boost_Scoutmemberone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

const fr_boost_scoutmemberone2 = /** @type {(inputs: Boost_Scoutmemberone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

const ar_boost_scoutmemberone2 = /** @type {(inputs: Boost_Scoutmemberone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كشاف`)
};

/**
* | output |
* | --- |
* | "Scout" |
*
* @param {Boost_Scoutmemberone2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_scoutmemberone2 = /** @type {((inputs?: Boost_Scoutmemberone2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Scoutmemberone2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_scoutmemberone2(inputs)
	if (locale === "es") return es_boost_scoutmemberone2(inputs)
	if (locale === "fr") return fr_boost_scoutmemberone2(inputs)
	return ar_boost_scoutmemberone2(inputs)
});
export { boost_scoutmemberone2 as "boost.scoutMemberOne" }