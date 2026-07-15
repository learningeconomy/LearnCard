/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Personone1Inputs */

const en_boost_personone1 = /** @type {(inputs: Boost_Personone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`person`)
};

const es_boost_personone1 = /** @type {(inputs: Boost_Personone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`persona`)
};

const fr_boost_personone1 = /** @type {(inputs: Boost_Personone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`personne`)
};

const ar_boost_personone1 = /** @type {(inputs: Boost_Personone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شخص`)
};

/**
* | output |
* | --- |
* | "person" |
*
* @param {Boost_Personone1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_personone1 = /** @type {((inputs?: Boost_Personone1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Personone1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_personone1(inputs)
	if (locale === "es") return es_boost_personone1(inputs)
	if (locale === "fr") return fr_boost_personone1(inputs)
	return ar_boost_personone1(inputs)
});
export { boost_personone1 as "boost.personOne" }