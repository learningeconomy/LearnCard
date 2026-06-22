/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_SkillInputs */

const en_boost_skill = /** @type {(inputs: Boost_SkillInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skill`)
};

const es_boost_skill = /** @type {(inputs: Boost_SkillInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidad`)
};

const fr_boost_skill = /** @type {(inputs: Boost_SkillInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétence`)
};

const ar_boost_skill = /** @type {(inputs: Boost_SkillInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهارة`)
};

/**
* | output |
* | --- |
* | "Skill" |
*
* @param {Boost_SkillInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_skill = /** @type {((inputs?: Boost_SkillInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_SkillInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_skill(inputs)
	if (locale === "es") return es_boost_skill(inputs)
	if (locale === "fr") return fr_boost_skill(inputs)
	return ar_boost_skill(inputs)
});
export { boost_skill as "boost.skill" }