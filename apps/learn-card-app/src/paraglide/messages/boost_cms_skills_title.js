/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Skills_TitleInputs */

const en_boost_cms_skills_title = /** @type {(inputs: Boost_Cms_Skills_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skills`)
};

const es_boost_cms_skills_title = /** @type {(inputs: Boost_Cms_Skills_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidades`)
};

const fr_boost_cms_skills_title = /** @type {(inputs: Boost_Cms_Skills_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences`)
};

const ar_boost_cms_skills_title = /** @type {(inputs: Boost_Cms_Skills_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المهارات`)
};

/**
* | output |
* | --- |
* | "Skills" |
*
* @param {Boost_Cms_Skills_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_skills_title = /** @type {((inputs?: Boost_Cms_Skills_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Skills_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_skills_title(inputs)
	if (locale === "es") return es_boost_cms_skills_title(inputs)
	if (locale === "fr") return fr_boost_cms_skills_title(inputs)
	return ar_boost_cms_skills_title(inputs)
});
export { boost_cms_skills_title as "boost.cms.skills.title" }