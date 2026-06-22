/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Steps_Addtranscript4Inputs */

const en_passport_buildmylearncard_steps_addtranscript4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Addtranscript4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Transcript`)
};

const es_passport_buildmylearncard_steps_addtranscript4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Addtranscript4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar expediente académico`)
};

const fr_passport_buildmylearncard_steps_addtranscript4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Addtranscript4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un relevé de notes`)
};

const ar_passport_buildmylearncard_steps_addtranscript4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Addtranscript4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة كشف درجات`)
};

/**
* | output |
* | --- |
* | "Add Transcript" |
*
* @param {Passport_Buildmylearncard_Steps_Addtranscript4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_steps_addtranscript4 = /** @type {((inputs?: Passport_Buildmylearncard_Steps_Addtranscript4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Steps_Addtranscript4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_steps_addtranscript4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_steps_addtranscript4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_steps_addtranscript4(inputs)
	return ar_passport_buildmylearncard_steps_addtranscript4(inputs)
});
export { passport_buildmylearncard_steps_addtranscript4 as "passport.buildMyLearnCard.steps.addTranscript" }