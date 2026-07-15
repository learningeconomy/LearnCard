/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_ExploreInputs */

const en_skills_explore = /** @type {(inputs: Skills_ExploreInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explore`)
};

const es_skills_explore = /** @type {(inputs: Skills_ExploreInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar`)
};

const fr_skills_explore = /** @type {(inputs: Skills_ExploreInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorer`)
};

const ar_skills_explore = /** @type {(inputs: Skills_ExploreInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استكشاف`)
};

/**
* | output |
* | --- |
* | "Explore" |
*
* @param {Skills_ExploreInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_explore = /** @type {((inputs?: Skills_ExploreInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_ExploreInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_explore(inputs)
	if (locale === "es") return es_skills_explore(inputs)
	if (locale === "fr") return fr_skills_explore(inputs)
	return ar_skills_explore(inputs)
});
export { skills_explore as "skills.explore" }