/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Steps_Addresume4Inputs */

const en_passport_buildmylearncard_steps_addresume4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Addresume4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Resume`)
};

const es_passport_buildmylearncard_steps_addresume4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Addresume4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar currículum`)
};

const fr_passport_buildmylearncard_steps_addresume4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Addresume4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un CV`)
};

const ar_passport_buildmylearncard_steps_addresume4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Addresume4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة سيرة ذاتية`)
};

/**
* | output |
* | --- |
* | "Add Resume" |
*
* @param {Passport_Buildmylearncard_Steps_Addresume4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_steps_addresume4 = /** @type {((inputs?: Passport_Buildmylearncard_Steps_Addresume4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Steps_Addresume4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_steps_addresume4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_steps_addresume4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_steps_addresume4(inputs)
	return ar_passport_buildmylearncard_steps_addresume4(inputs)
});
export { passport_buildmylearncard_steps_addresume4 as "passport.buildMyLearnCard.steps.addResume" }