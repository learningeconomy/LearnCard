/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Phrase_Warningwritepaper2Inputs */

const en_recovery_setup_phrase_warningwritepaper2 = /** @type {(inputs: Recovery_Setup_Phrase_Warningwritepaper2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Write it on paper and store it securely`)
};

const es_recovery_setup_phrase_warningwritepaper2 = /** @type {(inputs: Recovery_Setup_Phrase_Warningwritepaper2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escríbela en papel y guárdala de forma segura`)
};

const fr_recovery_setup_phrase_warningwritepaper2 = /** @type {(inputs: Recovery_Setup_Phrase_Warningwritepaper2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Écrivez-la sur du papier et rangez-la dans un endroit sécurisé`)
};

const ar_recovery_setup_phrase_warningwritepaper2 = /** @type {(inputs: Recovery_Setup_Phrase_Warningwritepaper2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اكتبها على ورق وخزّنها بشكل آمن`)
};

/**
* | output |
* | --- |
* | "Write it on paper and store it securely" |
*
* @param {Recovery_Setup_Phrase_Warningwritepaper2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_phrase_warningwritepaper2 = /** @type {((inputs?: Recovery_Setup_Phrase_Warningwritepaper2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Phrase_Warningwritepaper2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_phrase_warningwritepaper2(inputs)
	if (locale === "es") return es_recovery_setup_phrase_warningwritepaper2(inputs)
	if (locale === "fr") return fr_recovery_setup_phrase_warningwritepaper2(inputs)
	return ar_recovery_setup_phrase_warningwritepaper2(inputs)
});
export { recovery_setup_phrase_warningwritepaper2 as "recovery.setup.phrase.warningWritePaper" }