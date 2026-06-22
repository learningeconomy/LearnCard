/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ date: NonNullable<unknown> }} Passport_Resumebuilder_History_Editedon2Inputs */

const en_passport_resumebuilder_history_editedon2 = /** @type {(inputs: Passport_Resumebuilder_History_Editedon2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Edited on ${i?.date}`)
};

const es_passport_resumebuilder_history_editedon2 = /** @type {(inputs: Passport_Resumebuilder_History_Editedon2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Editado el ${i?.date}`)
};

const fr_passport_resumebuilder_history_editedon2 = /** @type {(inputs: Passport_Resumebuilder_History_Editedon2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Modifié le ${i?.date}`)
};

const ar_passport_resumebuilder_history_editedon2 = /** @type {(inputs: Passport_Resumebuilder_History_Editedon2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم التعديل في ${i?.date}`)
};

/**
* | output |
* | --- |
* | "Edited on {date}" |
*
* @param {Passport_Resumebuilder_History_Editedon2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_history_editedon2 = /** @type {((inputs: Passport_Resumebuilder_History_Editedon2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_History_Editedon2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_history_editedon2(inputs)
	if (locale === "es") return es_passport_resumebuilder_history_editedon2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_history_editedon2(inputs)
	return ar_passport_resumebuilder_history_editedon2(inputs)
});
export { passport_resumebuilder_history_editedon2 as "passport.resumeBuilder.history.editedOn" }