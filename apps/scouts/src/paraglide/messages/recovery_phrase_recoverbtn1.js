/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Phrase_Recoverbtn1Inputs */

const en_recovery_phrase_recoverbtn1 = /** @type {(inputs: Recovery_Phrase_Recoverbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recover Account`)
};

const es_recovery_phrase_recoverbtn1 = /** @type {(inputs: Recovery_Phrase_Recoverbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recuperar Cuenta`)
};

const fr_recovery_phrase_recoverbtn1 = /** @type {(inputs: Recovery_Phrase_Recoverbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupérer le compte`)
};

const ar_recovery_phrase_recoverbtn1 = /** @type {(inputs: Recovery_Phrase_Recoverbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استعادة الحساب`)
};

/**
* | output |
* | --- |
* | "Recover Account" |
*
* @param {Recovery_Phrase_Recoverbtn1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_phrase_recoverbtn1 = /** @type {((inputs?: Recovery_Phrase_Recoverbtn1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Phrase_Recoverbtn1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_phrase_recoverbtn1(inputs)
	if (locale === "es") return es_recovery_phrase_recoverbtn1(inputs)
	if (locale === "fr") return fr_recovery_phrase_recoverbtn1(inputs)
	return ar_recovery_phrase_recoverbtn1(inputs)
});
export { recovery_phrase_recoverbtn1 as "recovery.phrase.recoverBtn" }