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

/**
* | output |
* | --- |
* | "Skills" |
*
* @param {Sidemenu_Links_SkillsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_skills = /** @type {((inputs?: Sidemenu_Links_SkillsInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_SkillsInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_skills(inputs)
	if (locale === "es") return es_sidemenu_links_skills(inputs)
	if (locale === "de") return de_sidemenu_links_skills(inputs)
	return ar_sidemenu_links_skills(inputs)
});
export { sidemenu_links_skills as "sidemenu.links.skills" }