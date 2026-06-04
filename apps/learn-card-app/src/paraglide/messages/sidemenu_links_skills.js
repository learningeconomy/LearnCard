/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_SkillsInputs */

const en_sidemenu_links_skills = /** @type {(inputs: Sidemenu_Links_SkillsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skills`)
};

const es_sidemenu_links_skills = /** @type {(inputs: Sidemenu_Links_SkillsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidades`)
};

const de_sidemenu_links_skills = /** @type {(inputs: Sidemenu_Links_SkillsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fähigkeiten`)
};

const ar_sidemenu_links_skills = /** @type {(inputs: Sidemenu_Links_SkillsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المهارات`)
};

const fr_sidemenu_links_skills = /** @type {(inputs: Sidemenu_Links_SkillsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences`)
};

const ko_sidemenu_links_skills = /** @type {(inputs: Sidemenu_Links_SkillsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기술`)
};

/**
* | output |
* | --- |
* | "Skills" |
*
* @param {Sidemenu_Links_SkillsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_skills = /** @type {((inputs?: Sidemenu_Links_SkillsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_SkillsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_skills(inputs)
	if (locale === "es") return es_sidemenu_links_skills(inputs)
	if (locale === "de") return de_sidemenu_links_skills(inputs)
	if (locale === "ar") return ar_sidemenu_links_skills(inputs)
	if (locale === "fr") return fr_sidemenu_links_skills(inputs)
	return ko_sidemenu_links_skills(inputs)
});
export { sidemenu_links_skills as "sidemenu.links.skills" }