/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Manageskillframeworkstitle4Inputs */

const en_admintools_manageskillframeworkstitle4 = /** @type {(inputs: Admintools_Manageskillframeworkstitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage Skill Frameworks`)
};

const es_admintools_manageskillframeworkstitle4 = /** @type {(inputs: Admintools_Manageskillframeworkstitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar Marcos de Habilidades`)
};

const fr_admintools_manageskillframeworkstitle4 = /** @type {(inputs: Admintools_Manageskillframeworkstitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les cadres de compétences`)
};

const ar_admintools_manageskillframeworkstitle4 = /** @type {(inputs: Admintools_Manageskillframeworkstitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة أُطر المهارات`)
};

/**
* | output |
* | --- |
* | "Manage Skill Frameworks" |
*
* @param {Admintools_Manageskillframeworkstitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_manageskillframeworkstitle4 = /** @type {((inputs?: Admintools_Manageskillframeworkstitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Manageskillframeworkstitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_manageskillframeworkstitle4(inputs)
	if (locale === "es") return es_admintools_manageskillframeworkstitle4(inputs)
	if (locale === "fr") return fr_admintools_manageskillframeworkstitle4(inputs)
	return ar_admintools_manageskillframeworkstitle4(inputs)
});
export { admintools_manageskillframeworkstitle4 as "adminTools.manageSkillFrameworksTitle" }