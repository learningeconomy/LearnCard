/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Skills_Addskills1Inputs */

const en_boost_cms_skills_addskills1 = /** @type {(inputs: Boost_Cms_Skills_Addskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Skills`)
};

const es_boost_cms_skills_addskills1 = /** @type {(inputs: Boost_Cms_Skills_Addskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar habilidades`)
};

const fr_boost_cms_skills_addskills1 = /** @type {(inputs: Boost_Cms_Skills_Addskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter des compétences`)
};

const ar_boost_cms_skills_addskills1 = /** @type {(inputs: Boost_Cms_Skills_Addskills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة مهارات`)
};

/**
* | output |
* | --- |
* | "Add Skills" |
*
* @param {Boost_Cms_Skills_Addskills1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_skills_addskills1 = /** @type {((inputs?: Boost_Cms_Skills_Addskills1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Skills_Addskills1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_skills_addskills1(inputs)
	if (locale === "es") return es_boost_cms_skills_addskills1(inputs)
	if (locale === "fr") return fr_boost_cms_skills_addskills1(inputs)
	return ar_boost_cms_skills_addskills1(inputs)
});
export { boost_cms_skills_addskills1 as "boost.cms.skills.addSkills" }