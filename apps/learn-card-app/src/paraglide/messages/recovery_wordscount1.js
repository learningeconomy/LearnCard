/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Recovery_Wordscount1Inputs */

const en_recovery_wordscount1 = /** @type {(inputs: Recovery_Wordscount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} / 25 words`)
};

const es_recovery_wordscount1 = /** @type {(inputs: Recovery_Wordscount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} / 25 palabras`)
};

const fr_recovery_wordscount1 = /** @type {(inputs: Recovery_Wordscount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} / 25 mots`)
};

const ar_recovery_wordscount1 = /** @type {(inputs: Recovery_Wordscount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} / 25 كلمة`)
};

/**
* | output |
* | --- |
* | "{count} / 25 words" |
*
* @param {Recovery_Wordscount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_wordscount1 = /** @type {((inputs: Recovery_Wordscount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Wordscount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_wordscount1(inputs)
	if (locale === "es") return es_recovery_wordscount1(inputs)
	if (locale === "fr") return fr_recovery_wordscount1(inputs)
	return ar_recovery_wordscount1(inputs)
});
export { recovery_wordscount1 as "recovery.wordsCount" }