/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_History_Newresume2Inputs */

const en_passport_resumebuilder_history_newresume2 = /** @type {(inputs: Passport_Resumebuilder_History_Newresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ New Resume`)
};

const es_passport_resumebuilder_history_newresume2 = /** @type {(inputs: Passport_Resumebuilder_History_Newresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Nuevo currículum`)
};

const fr_passport_resumebuilder_history_newresume2 = /** @type {(inputs: Passport_Resumebuilder_History_Newresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Nouveau CV`)
};

const ar_passport_resumebuilder_history_newresume2 = /** @type {(inputs: Passport_Resumebuilder_History_Newresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ سيرة ذاتية جديدة`)
};

/**
* | output |
* | --- |
* | "+ New Resume" |
*
* @param {Passport_Resumebuilder_History_Newresume2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_history_newresume2 = /** @type {((inputs?: Passport_Resumebuilder_History_Newresume2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_History_Newresume2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_history_newresume2(inputs)
	if (locale === "es") return es_passport_resumebuilder_history_newresume2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_history_newresume2(inputs)
	return ar_passport_resumebuilder_history_newresume2(inputs)
});
export { passport_resumebuilder_history_newresume2 as "passport.resumeBuilder.history.newResume" }