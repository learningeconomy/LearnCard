/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Onemorestep2Inputs */

const en_boost_onemorestep2 = /** @type {(inputs: Boost_Onemorestep2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`One more step!`)
};

const es_boost_onemorestep2 = /** @type {(inputs: Boost_Onemorestep2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Un paso más!`)
};

const fr_boost_onemorestep2 = /** @type {(inputs: Boost_Onemorestep2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Encore une étape !`)
};

const ar_boost_onemorestep2 = /** @type {(inputs: Boost_Onemorestep2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`One more step!`)
};

/**
* | output |
* | --- |
* | "One more step!" |
*
* @param {Boost_Onemorestep2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_onemorestep2 = /** @type {((inputs?: Boost_Onemorestep2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Onemorestep2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_onemorestep2(inputs)
	if (locale === "es") return es_boost_onemorestep2(inputs)
	if (locale === "fr") return fr_boost_onemorestep2(inputs)
	return ar_boost_onemorestep2(inputs)
});
export { boost_onemorestep2 as "boost.oneMoreStep" }