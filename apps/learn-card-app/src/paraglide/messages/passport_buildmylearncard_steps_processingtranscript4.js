/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Steps_Processingtranscript4Inputs */

const en_passport_buildmylearncard_steps_processingtranscript4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Processingtranscript4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Processing Transcript…`)
};

const es_passport_buildmylearncard_steps_processingtranscript4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Processingtranscript4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Procesando expediente…`)
};

const fr_passport_buildmylearncard_steps_processingtranscript4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Processingtranscript4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Traitement du relevé de notes…`)
};

const ar_passport_buildmylearncard_steps_processingtranscript4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Processingtranscript4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ معالجة كشف الدرجات…`)
};

/**
* | output |
* | --- |
* | "Processing Transcript…" |
*
* @param {Passport_Buildmylearncard_Steps_Processingtranscript4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_steps_processingtranscript4 = /** @type {((inputs?: Passport_Buildmylearncard_Steps_Processingtranscript4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Steps_Processingtranscript4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_steps_processingtranscript4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_steps_processingtranscript4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_steps_processingtranscript4(inputs)
	return ar_passport_buildmylearncard_steps_processingtranscript4(inputs)
});
export { passport_buildmylearncard_steps_processingtranscript4 as "passport.buildMyLearnCard.steps.processingTranscript" }