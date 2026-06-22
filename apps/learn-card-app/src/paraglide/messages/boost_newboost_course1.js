/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Newboost_Course1Inputs */

const en_boost_newboost_course1 = /** @type {(inputs: Boost_Newboost_Course1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Course`)
};

const es_boost_newboost_course1 = /** @type {(inputs: Boost_Newboost_Course1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevo curso`)
};

const fr_boost_newboost_course1 = /** @type {(inputs: Boost_Newboost_Course1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouveau cours`)
};

const ar_boost_newboost_course1 = /** @type {(inputs: Boost_Newboost_Course1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دورة جديدة`)
};

/**
* | output |
* | --- |
* | "New Course" |
*
* @param {Boost_Newboost_Course1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_newboost_course1 = /** @type {((inputs?: Boost_Newboost_Course1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Newboost_Course1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_newboost_course1(inputs)
	if (locale === "es") return es_boost_newboost_course1(inputs)
	if (locale === "fr") return fr_boost_newboost_course1(inputs)
	return ar_boost_newboost_course1(inputs)
});
export { boost_newboost_course1 as "boost.newBoost.course" }