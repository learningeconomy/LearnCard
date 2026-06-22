/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_History_Empty1Inputs */

const en_passport_resumebuilder_history_empty1 = /** @type {(inputs: Passport_Resumebuilder_History_Empty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No existing resumes yet.`)
};

const es_passport_resumebuilder_history_empty1 = /** @type {(inputs: Passport_Resumebuilder_History_Empty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay currículums.`)
};

const fr_passport_resumebuilder_history_empty1 = /** @type {(inputs: Passport_Resumebuilder_History_Empty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun CV pour le moment.`)
};

const ar_passport_resumebuilder_history_empty1 = /** @type {(inputs: Passport_Resumebuilder_History_Empty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد سير ذاتية بعد.`)
};

/**
* | output |
* | --- |
* | "No existing resumes yet." |
*
* @param {Passport_Resumebuilder_History_Empty1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_history_empty1 = /** @type {((inputs?: Passport_Resumebuilder_History_Empty1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_History_Empty1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_history_empty1(inputs)
	if (locale === "es") return es_passport_resumebuilder_history_empty1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_history_empty1(inputs)
	return ar_passport_resumebuilder_history_empty1(inputs)
});
export { passport_resumebuilder_history_empty1 as "passport.resumeBuilder.history.empty" }