/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_RequirementsInputs */

const en_boost_requirements = /** @type {(inputs: Boost_RequirementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requirements`)
};

const es_boost_requirements = /** @type {(inputs: Boost_RequirementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requisitos`)
};

const fr_boost_requirements = /** @type {(inputs: Boost_RequirementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exigences`)
};

const ar_boost_requirements = /** @type {(inputs: Boost_RequirementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المتطلبات`)
};

/**
* | output |
* | --- |
* | "Requirements" |
*
* @param {Boost_RequirementsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_requirements = /** @type {((inputs?: Boost_RequirementsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_RequirementsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_requirements(inputs)
	if (locale === "es") return es_boost_requirements(inputs)
	if (locale === "fr") return fr_boost_requirements(inputs)
	return ar_boost_requirements(inputs)
});
export { boost_requirements as "boost.requirements" }