/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Editskills2Inputs */

const en_skillframeworks_editskills2 = /** @type {(inputs: Skillframeworks_Editskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Skills`)
};

const es_skillframeworks_editskills2 = /** @type {(inputs: Skillframeworks_Editskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar Habilidades`)
};

const fr_skillframeworks_editskills2 = /** @type {(inputs: Skillframeworks_Editskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier les compétences`)
};

const ar_skillframeworks_editskills2 = /** @type {(inputs: Skillframeworks_Editskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Skills`)
};

/**
* | output |
* | --- |
* | "Edit Skills" |
*
* @param {Skillframeworks_Editskills2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_editskills2 = /** @type {((inputs?: Skillframeworks_Editskills2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Editskills2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_editskills2(inputs)
	if (locale === "es") return es_skillframeworks_editskills2(inputs)
	if (locale === "fr") return fr_skillframeworks_editskills2(inputs)
	return ar_skillframeworks_editskills2(inputs)
});
export { skillframeworks_editskills2 as "skillFrameworks.editSkills" }