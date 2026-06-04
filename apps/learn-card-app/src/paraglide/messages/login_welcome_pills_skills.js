/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Welcome_Pills_SkillsInputs */

const en_login_welcome_pills_skills = /** @type {(inputs: Login_Welcome_Pills_SkillsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skills`)
};

const es_login_welcome_pills_skills = /** @type {(inputs: Login_Welcome_Pills_SkillsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidades`)
};

const de_login_welcome_pills_skills = /** @type {(inputs: Login_Welcome_Pills_SkillsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fähigkeiten`)
};

const ar_login_welcome_pills_skills = /** @type {(inputs: Login_Welcome_Pills_SkillsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المهارات`)
};

const fr_login_welcome_pills_skills = /** @type {(inputs: Login_Welcome_Pills_SkillsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences`)
};

const ko_login_welcome_pills_skills = /** @type {(inputs: Login_Welcome_Pills_SkillsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기술`)
};

/**
* | output |
* | --- |
* | "Skills" |
*
* @param {Login_Welcome_Pills_SkillsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_welcome_pills_skills = /** @type {((inputs?: Login_Welcome_Pills_SkillsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Welcome_Pills_SkillsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_welcome_pills_skills(inputs)
	if (locale === "es") return es_login_welcome_pills_skills(inputs)
	if (locale === "de") return de_login_welcome_pills_skills(inputs)
	if (locale === "ar") return ar_login_welcome_pills_skills(inputs)
	if (locale === "fr") return fr_login_welcome_pills_skills(inputs)
	return ko_login_welcome_pills_skills(inputs)
});
export { login_welcome_pills_skills as "login.welcome.pills.skills" }