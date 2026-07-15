/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Phrase_Savedrow1Inputs */

const en_recovery_setup_phrase_savedrow1 = /** @type {(inputs: Recovery_Setup_Phrase_Savedrow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phrase is saved`)
};

const es_recovery_setup_phrase_savedrow1 = /** @type {(inputs: Recovery_Setup_Phrase_Savedrow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Frase guardada`)
};

const fr_recovery_setup_phrase_savedrow1 = /** @type {(inputs: Recovery_Setup_Phrase_Savedrow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La phrase est sauvegardée`)
};

const ar_recovery_setup_phrase_savedrow1 = /** @type {(inputs: Recovery_Setup_Phrase_Savedrow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حفظ العبارة`)
};

/**
* | output |
* | --- |
* | "Phrase is saved" |
*
* @param {Recovery_Setup_Phrase_Savedrow1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_phrase_savedrow1 = /** @type {((inputs?: Recovery_Setup_Phrase_Savedrow1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Phrase_Savedrow1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_phrase_savedrow1(inputs)
	if (locale === "es") return es_recovery_setup_phrase_savedrow1(inputs)
	if (locale === "fr") return fr_recovery_setup_phrase_savedrow1(inputs)
	return ar_recovery_setup_phrase_savedrow1(inputs)
});
export { recovery_setup_phrase_savedrow1 as "recovery.setup.phrase.savedRow" }