/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Managefwdesc3Inputs */

const en_skillframeworks_managefwdesc3 = /** @type {(inputs: Skillframeworks_Managefwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage and import skill frameworks.`)
};

const es_skillframeworks_managefwdesc3 = /** @type {(inputs: Skillframeworks_Managefwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestiona e importa marcos de habilidades.`)
};

const fr_skillframeworks_managefwdesc3 = /** @type {(inputs: Skillframeworks_Managefwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer et importer des cadres de compétences.`)
};

const ar_skillframeworks_managefwdesc3 = /** @type {(inputs: Skillframeworks_Managefwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage and import skill frameworks.`)
};

/**
* | output |
* | --- |
* | "Manage and import skill frameworks." |
*
* @param {Skillframeworks_Managefwdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_managefwdesc3 = /** @type {((inputs?: Skillframeworks_Managefwdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Managefwdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_managefwdesc3(inputs)
	if (locale === "es") return es_skillframeworks_managefwdesc3(inputs)
	if (locale === "fr") return fr_skillframeworks_managefwdesc3(inputs)
	return ar_skillframeworks_managefwdesc3(inputs)
});
export { skillframeworks_managefwdesc3 as "skillFrameworks.manageFwDesc" }