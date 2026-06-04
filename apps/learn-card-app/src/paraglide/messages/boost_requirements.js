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

const de_boost_requirements = /** @type {(inputs: Boost_RequirementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anforderungen`)
};

const ar_boost_requirements = /** @type {(inputs: Boost_RequirementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المتطلبات`)
};

const fr_boost_requirements = /** @type {(inputs: Boost_RequirementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exigences`)
};

const ko_boost_requirements = /** @type {(inputs: Boost_RequirementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`요구사항`)
};

/**
* | output |
* | --- |
* | "Requirements" |
*
* @param {Boost_RequirementsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_requirements = /** @type {((inputs?: Boost_RequirementsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_RequirementsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_requirements(inputs)
	if (locale === "es") return es_boost_requirements(inputs)
	if (locale === "de") return de_boost_requirements(inputs)
	if (locale === "ar") return ar_boost_requirements(inputs)
	if (locale === "fr") return fr_boost_requirements(inputs)
	return ko_boost_requirements(inputs)
});
export { boost_requirements as "boost.requirements" }