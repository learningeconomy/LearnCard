/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Scoutmemberother2Inputs */

const en_boost_scoutmemberother2 = /** @type {(inputs: Boost_Scoutmemberother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scouts`)
};

const es_boost_scoutmemberother2 = /** @type {(inputs: Boost_Scoutmemberother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scouts`)
};

const fr_boost_scoutmemberother2 = /** @type {(inputs: Boost_Scoutmemberother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scouts`)
};

const ar_boost_scoutmemberother2 = /** @type {(inputs: Boost_Scoutmemberother2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scouts`)
};

/**
* | output |
* | --- |
* | "Scouts" |
*
* @param {Boost_Scoutmemberother2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_scoutmemberother2 = /** @type {((inputs?: Boost_Scoutmemberother2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Scoutmemberother2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_scoutmemberother2(inputs)
	if (locale === "es") return es_boost_scoutmemberother2(inputs)
	if (locale === "fr") return fr_boost_scoutmemberother2(inputs)
	return ar_boost_scoutmemberother2(inputs)
});
export { boost_scoutmemberother2 as "boost.scoutMemberOther" }