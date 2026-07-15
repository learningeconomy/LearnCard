/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Phrase_Gennewbtn2Inputs */

const en_recovery_setup_phrase_gennewbtn2 = /** @type {(inputs: Recovery_Setup_Phrase_Gennewbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate New Phrase`)
};

const es_recovery_setup_phrase_gennewbtn2 = /** @type {(inputs: Recovery_Setup_Phrase_Gennewbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generar Nueva Frase`)
};

const fr_recovery_setup_phrase_gennewbtn2 = /** @type {(inputs: Recovery_Setup_Phrase_Gennewbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer une nouvelle phrase`)
};

const ar_recovery_setup_phrase_gennewbtn2 = /** @type {(inputs: Recovery_Setup_Phrase_Gennewbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate New Phrase`)
};

/**
* | output |
* | --- |
* | "Generate New Phrase" |
*
* @param {Recovery_Setup_Phrase_Gennewbtn2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_phrase_gennewbtn2 = /** @type {((inputs?: Recovery_Setup_Phrase_Gennewbtn2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Phrase_Gennewbtn2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_phrase_gennewbtn2(inputs)
	if (locale === "es") return es_recovery_setup_phrase_gennewbtn2(inputs)
	if (locale === "fr") return fr_recovery_setup_phrase_gennewbtn2(inputs)
	return ar_recovery_setup_phrase_gennewbtn2(inputs)
});
export { recovery_setup_phrase_gennewbtn2 as "recovery.setup.phrase.genNewBtn" }