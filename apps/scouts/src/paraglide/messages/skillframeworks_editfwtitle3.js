/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Editfwtitle3Inputs */

const en_skillframeworks_editfwtitle3 = /** @type {(inputs: Skillframeworks_Editfwtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Skill Framework`)
};

const es_skillframeworks_editfwtitle3 = /** @type {(inputs: Skillframeworks_Editfwtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar Marco de Habilidades`)
};

const fr_skillframeworks_editfwtitle3 = /** @type {(inputs: Skillframeworks_Editfwtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier le cadre de compétences`)
};

const ar_skillframeworks_editfwtitle3 = /** @type {(inputs: Skillframeworks_Editfwtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Skill Framework`)
};

/**
* | output |
* | --- |
* | "Edit Skill Framework" |
*
* @param {Skillframeworks_Editfwtitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_editfwtitle3 = /** @type {((inputs?: Skillframeworks_Editfwtitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Editfwtitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_editfwtitle3(inputs)
	if (locale === "es") return es_skillframeworks_editfwtitle3(inputs)
	if (locale === "fr") return fr_skillframeworks_editfwtitle3(inputs)
	return ar_skillframeworks_editfwtitle3(inputs)
});
export { skillframeworks_editfwtitle3 as "skillFrameworks.editFwTitle" }