/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Incorrectcode1Inputs */

const en_recovery_incorrectcode1 = /** @type {(inputs: Recovery_Incorrectcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Incorrect code. Please try again.`)
};

const es_recovery_incorrectcode1 = /** @type {(inputs: Recovery_Incorrectcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código incorrecto. Inténtalo de nuevo.`)
};

const de_recovery_incorrectcode1 = /** @type {(inputs: Recovery_Incorrectcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Falscher Code. Bitte versuche es erneut.`)
};

const ar_recovery_incorrectcode1 = /** @type {(inputs: Recovery_Incorrectcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز غير صحيح. يرجى المحاولة مرة أخرى.`)
};

const fr_recovery_incorrectcode1 = /** @type {(inputs: Recovery_Incorrectcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code incorrect. Veuillez réessayer.`)
};

const ko_recovery_incorrectcode1 = /** @type {(inputs: Recovery_Incorrectcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`잘못된 코드입니다. 다시 시도해 주세요.`)
};

/**
* | output |
* | --- |
* | "Incorrect code. Please try again." |
*
* @param {Recovery_Incorrectcode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_incorrectcode1 = /** @type {((inputs?: Recovery_Incorrectcode1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Incorrectcode1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_incorrectcode1(inputs)
	if (locale === "es") return es_recovery_incorrectcode1(inputs)
	if (locale === "de") return de_recovery_incorrectcode1(inputs)
	if (locale === "ar") return ar_recovery_incorrectcode1(inputs)
	if (locale === "fr") return fr_recovery_incorrectcode1(inputs)
	return ko_recovery_incorrectcode1(inputs)
});
export { recovery_incorrectcode1 as "recovery.incorrectCode" }