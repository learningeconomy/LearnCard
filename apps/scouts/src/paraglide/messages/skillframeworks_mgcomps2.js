/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Mgcomps2Inputs */

const en_skillframeworks_mgcomps2 = /** @type {(inputs: Skillframeworks_Mgcomps2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage Competencies`)
};

const es_skillframeworks_mgcomps2 = /** @type {(inputs: Skillframeworks_Mgcomps2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar Competencias`)
};

const fr_skillframeworks_mgcomps2 = /** @type {(inputs: Skillframeworks_Mgcomps2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les compétences`)
};

const ar_skillframeworks_mgcomps2 = /** @type {(inputs: Skillframeworks_Mgcomps2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة الكفاءات`)
};

/**
* | output |
* | --- |
* | "Manage Competencies" |
*
* @param {Skillframeworks_Mgcomps2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_mgcomps2 = /** @type {((inputs?: Skillframeworks_Mgcomps2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Mgcomps2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_mgcomps2(inputs)
	if (locale === "es") return es_skillframeworks_mgcomps2(inputs)
	if (locale === "fr") return fr_skillframeworks_mgcomps2(inputs)
	return ar_skillframeworks_mgcomps2(inputs)
});
export { skillframeworks_mgcomps2 as "skillFrameworks.mgComps" }