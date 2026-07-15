/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_History_Typeissued1Inputs */

const en_troops_history_typeissued1 = /** @type {(inputs: Troops_History_Typeissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issued`)
};

const es_troops_history_typeissued1 = /** @type {(inputs: Troops_History_Typeissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitido`)
};

const fr_troops_history_typeissued1 = /** @type {(inputs: Troops_History_Typeissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Délivré`)
};

const ar_troops_history_typeissued1 = /** @type {(inputs: Troops_History_Typeissued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issued`)
};

/**
* | output |
* | --- |
* | "Issued" |
*
* @param {Troops_History_Typeissued1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_history_typeissued1 = /** @type {((inputs?: Troops_History_Typeissued1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_History_Typeissued1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_history_typeissued1(inputs)
	if (locale === "es") return es_troops_history_typeissued1(inputs)
	if (locale === "fr") return fr_troops_history_typeissued1(inputs)
	return ar_troops_history_typeissued1(inputs)
});
export { troops_history_typeissued1 as "troops.history.typeIssued" }