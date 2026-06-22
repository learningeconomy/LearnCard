/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Newboost_Skill1Inputs */

const en_boost_newboost_skill1 = /** @type {(inputs: Boost_Newboost_Skill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Skill`)
};

const es_boost_newboost_skill1 = /** @type {(inputs: Boost_Newboost_Skill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva habilidad`)
};

const fr_boost_newboost_skill1 = /** @type {(inputs: Boost_Newboost_Skill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle compétence`)
};

const ar_boost_newboost_skill1 = /** @type {(inputs: Boost_Newboost_Skill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهارة جديدة`)
};

/**
* | output |
* | --- |
* | "New Skill" |
*
* @param {Boost_Newboost_Skill1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_newboost_skill1 = /** @type {((inputs?: Boost_Newboost_Skill1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Newboost_Skill1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_newboost_skill1(inputs)
	if (locale === "es") return es_boost_newboost_skill1(inputs)
	if (locale === "fr") return fr_boost_newboost_skill1(inputs)
	return ar_boost_newboost_skill1(inputs)
});
export { boost_newboost_skill1 as "boost.newBoost.skill" }