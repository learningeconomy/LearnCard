/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Addskills2Inputs */

const en_skillframeworks_addskills2 = /** @type {(inputs: Skillframeworks_Addskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add {count} Skill`)
};

const es_skillframeworks_addskills2 = /** @type {(inputs: Skillframeworks_Addskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir {count} Habilidad`)
};

const fr_skillframeworks_addskills2 = /** @type {(inputs: Skillframeworks_Addskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter {count} compétence`)
};

const ar_skillframeworks_addskills2 = /** @type {(inputs: Skillframeworks_Addskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة {count} مهارة`)
};

/**
* | output |
* | --- |
* | "Add {count} Skill" |
*
* @param {Skillframeworks_Addskills2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_addskills2 = /** @type {((inputs?: Skillframeworks_Addskills2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Addskills2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_addskills2(inputs)
	if (locale === "es") return es_skillframeworks_addskills2(inputs)
	if (locale === "fr") return fr_skillframeworks_addskills2(inputs)
	return ar_skillframeworks_addskills2(inputs)
});
export { skillframeworks_addskills2 as "skillFrameworks.addSkills" }