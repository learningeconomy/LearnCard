/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_AccomplishmentInputs */

const en_boost_accomplishment = /** @type {(inputs: Boost_AccomplishmentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accomplishment`)
};

const es_boost_accomplishment = /** @type {(inputs: Boost_AccomplishmentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hazaña`)
};

const fr_boost_accomplishment = /** @type {(inputs: Boost_AccomplishmentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accomplissement`)
};

const ar_boost_accomplishment = /** @type {(inputs: Boost_AccomplishmentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنجاز`)
};

/**
* | output |
* | --- |
* | "Accomplishment" |
*
* @param {Boost_AccomplishmentInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_accomplishment = /** @type {((inputs?: Boost_AccomplishmentInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_AccomplishmentInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_accomplishment(inputs)
	if (locale === "es") return es_boost_accomplishment(inputs)
	if (locale === "fr") return fr_boost_accomplishment(inputs)
	return ar_boost_accomplishment(inputs)
});
export { boost_accomplishment as "boost.accomplishment" }