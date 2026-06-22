/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_History_Noeditdate3Inputs */

const en_passport_resumebuilder_history_noeditdate3 = /** @type {(inputs: Passport_Resumebuilder_History_Noeditdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No edit date`)
};

const es_passport_resumebuilder_history_noeditdate3 = /** @type {(inputs: Passport_Resumebuilder_History_Noeditdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin fecha de edición`)
};

const fr_passport_resumebuilder_history_noeditdate3 = /** @type {(inputs: Passport_Resumebuilder_History_Noeditdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune date de modification`)
};

const ar_passport_resumebuilder_history_noeditdate3 = /** @type {(inputs: Passport_Resumebuilder_History_Noeditdate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يوجد تاريخ تعديل`)
};

/**
* | output |
* | --- |
* | "No edit date" |
*
* @param {Passport_Resumebuilder_History_Noeditdate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_history_noeditdate3 = /** @type {((inputs?: Passport_Resumebuilder_History_Noeditdate3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_History_Noeditdate3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_history_noeditdate3(inputs)
	if (locale === "es") return es_passport_resumebuilder_history_noeditdate3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_history_noeditdate3(inputs)
	return ar_passport_resumebuilder_history_noeditdate3(inputs)
});
export { passport_resumebuilder_history_noeditdate3 as "passport.resumeBuilder.history.noEditDate" }