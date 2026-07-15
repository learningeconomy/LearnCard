/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Meritbadge1Inputs */

const en_boost_meritbadge1 = /** @type {(inputs: Boost_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Merit Badge`)
};

const es_boost_meritbadge1 = /** @type {(inputs: Boost_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignia de Mérito`)
};

const fr_boost_meritbadge1 = /** @type {(inputs: Boost_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badge de mérite`)
};

const ar_boost_meritbadge1 = /** @type {(inputs: Boost_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارة الجدارة`)
};

/**
* | output |
* | --- |
* | "Merit Badge" |
*
* @param {Boost_Meritbadge1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_meritbadge1 = /** @type {((inputs?: Boost_Meritbadge1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Meritbadge1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_meritbadge1(inputs)
	if (locale === "es") return es_boost_meritbadge1(inputs)
	if (locale === "fr") return fr_boost_meritbadge1(inputs)
	return ar_boost_meritbadge1(inputs)
});
export { boost_meritbadge1 as "boost.meritBadge" }