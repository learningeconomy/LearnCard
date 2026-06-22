/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Selfattested_Addskill5Inputs */

const en_passport_buildmylearncard_managers_selfattested_addskill5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Selfattested_Addskill5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a skill`)
};

const es_passport_buildmylearncard_managers_selfattested_addskill5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Selfattested_Addskill5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir una habilidad`)
};

const fr_passport_buildmylearncard_managers_selfattested_addskill5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Selfattested_Addskill5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter une compétence`)
};

const ar_passport_buildmylearncard_managers_selfattested_addskill5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Selfattested_Addskill5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة مهارة`)
};

/**
* | output |
* | --- |
* | "Add a skill" |
*
* @param {Passport_Buildmylearncard_Managers_Selfattested_Addskill5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_selfattested_addskill5 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Selfattested_Addskill5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Selfattested_Addskill5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_selfattested_addskill5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_selfattested_addskill5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_selfattested_addskill5(inputs)
	return ar_passport_buildmylearncard_managers_selfattested_addskill5(inputs)
});
export { passport_buildmylearncard_managers_selfattested_addskill5 as "passport.buildMyLearnCard.managers.selfAttested.addSkill" }