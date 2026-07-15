/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Confirmdelskill3Inputs */

const en_skillframeworks_confirmdelskill3 = /** @type {(inputs: Skillframeworks_Confirmdelskill3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please confirm deletion of this skill.`)
};

const es_skillframeworks_confirmdelskill3 = /** @type {(inputs: Skillframeworks_Confirmdelskill3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirma la eliminación de esta habilidad.`)
};

const fr_skillframeworks_confirmdelskill3 = /** @type {(inputs: Skillframeworks_Confirmdelskill3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez confirmer la suppression de cette compétence.`)
};

const ar_skillframeworks_confirmdelskill3 = /** @type {(inputs: Skillframeworks_Confirmdelskill3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى تأكيد حذف هذه المهارة.`)
};

/**
* | output |
* | --- |
* | "Please confirm deletion of this skill." |
*
* @param {Skillframeworks_Confirmdelskill3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_confirmdelskill3 = /** @type {((inputs?: Skillframeworks_Confirmdelskill3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Confirmdelskill3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_confirmdelskill3(inputs)
	if (locale === "es") return es_skillframeworks_confirmdelskill3(inputs)
	if (locale === "fr") return fr_skillframeworks_confirmdelskill3(inputs)
	return ar_skillframeworks_confirmdelskill3(inputs)
});
export { skillframeworks_confirmdelskill3 as "skillFrameworks.confirmDelSkill" }