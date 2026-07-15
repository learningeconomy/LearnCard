/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Manageskillframeworkslabel4Inputs */

const en_admintools_manageskillframeworkslabel4 = /** @type {(inputs: Admintools_Manageskillframeworkslabel4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage Skill Frameworks`)
};

const es_admintools_manageskillframeworkslabel4 = /** @type {(inputs: Admintools_Manageskillframeworkslabel4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar Marcos de Habilidades`)
};

const fr_admintools_manageskillframeworkslabel4 = /** @type {(inputs: Admintools_Manageskillframeworkslabel4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les cadres de compétences`)
};

const ar_admintools_manageskillframeworkslabel4 = /** @type {(inputs: Admintools_Manageskillframeworkslabel4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage Skill Frameworks`)
};

/**
* | output |
* | --- |
* | "Manage Skill Frameworks" |
*
* @param {Admintools_Manageskillframeworkslabel4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_manageskillframeworkslabel4 = /** @type {((inputs?: Admintools_Manageskillframeworkslabel4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Manageskillframeworkslabel4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_manageskillframeworkslabel4(inputs)
	if (locale === "es") return es_admintools_manageskillframeworkslabel4(inputs)
	if (locale === "fr") return fr_admintools_manageskillframeworkslabel4(inputs)
	return ar_admintools_manageskillframeworkslabel4(inputs)
});
export { admintools_manageskillframeworkslabel4 as "adminTools.manageSkillFrameworksLabel" }