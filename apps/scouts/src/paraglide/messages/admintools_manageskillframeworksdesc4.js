/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Manageskillframeworksdesc4Inputs */

const en_admintools_manageskillframeworksdesc4 = /** @type {(inputs: Admintools_Manageskillframeworksdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage and import skill frameworks.`)
};

const es_admintools_manageskillframeworksdesc4 = /** @type {(inputs: Admintools_Manageskillframeworksdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestiona e importa marcos de habilidades.`)
};

const fr_admintools_manageskillframeworksdesc4 = /** @type {(inputs: Admintools_Manageskillframeworksdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer et importer des cadres de compétences.`)
};

const ar_admintools_manageskillframeworksdesc4 = /** @type {(inputs: Admintools_Manageskillframeworksdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage and import skill frameworks.`)
};

/**
* | output |
* | --- |
* | "Manage and import skill frameworks." |
*
* @param {Admintools_Manageskillframeworksdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_manageskillframeworksdesc4 = /** @type {((inputs?: Admintools_Manageskillframeworksdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Manageskillframeworksdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_manageskillframeworksdesc4(inputs)
	if (locale === "es") return es_admintools_manageskillframeworksdesc4(inputs)
	if (locale === "fr") return fr_admintools_manageskillframeworksdesc4(inputs)
	return ar_admintools_manageskillframeworksdesc4(inputs)
});
export { admintools_manageskillframeworksdesc4 as "adminTools.manageSkillFrameworksDesc" }