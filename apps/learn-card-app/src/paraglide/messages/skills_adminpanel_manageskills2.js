/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Adminpanel_Manageskills2Inputs */

const en_skills_adminpanel_manageskills2 = /** @type {(inputs: Skills_Adminpanel_Manageskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage Skills`)
};

const es_skills_adminpanel_manageskills2 = /** @type {(inputs: Skills_Adminpanel_Manageskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar habilidades`)
};

const fr_skills_adminpanel_manageskills2 = /** @type {(inputs: Skills_Adminpanel_Manageskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les compétences`)
};

const ar_skills_adminpanel_manageskills2 = /** @type {(inputs: Skills_Adminpanel_Manageskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة المهارات`)
};

/**
* | output |
* | --- |
* | "Manage Skills" |
*
* @param {Skills_Adminpanel_Manageskills2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_adminpanel_manageskills2 = /** @type {((inputs?: Skills_Adminpanel_Manageskills2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Adminpanel_Manageskills2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_adminpanel_manageskills2(inputs)
	if (locale === "es") return es_skills_adminpanel_manageskills2(inputs)
	if (locale === "fr") return fr_skills_adminpanel_manageskills2(inputs)
	return ar_skills_adminpanel_manageskills2(inputs)
});
export { skills_adminpanel_manageskills2 as "skills.adminPanel.manageSkills" }