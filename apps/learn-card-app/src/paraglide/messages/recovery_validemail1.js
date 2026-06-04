/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Validemail1Inputs */

const en_recovery_validemail1 = /** @type {(inputs: Recovery_Validemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter a valid email address.`)
};

const es_recovery_validemail1 = /** @type {(inputs: Recovery_Validemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Introduce un correo electrónico válido.`)
};

const de_recovery_validemail1 = /** @type {(inputs: Recovery_Validemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bitte gib eine gültige E-Mail-Adresse ein.`)
};

const ar_recovery_validemail1 = /** @type {(inputs: Recovery_Validemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال عنوان بريد إلكتروني صالح.`)
};

const fr_recovery_validemail1 = /** @type {(inputs: Recovery_Validemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez saisir une adresse e-mail valide.`)
};

const ko_recovery_validemail1 = /** @type {(inputs: Recovery_Validemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`유효한 이메일 주소를 입력하세요.`)
};

/**
* | output |
* | --- |
* | "Please enter a valid email address." |
*
* @param {Recovery_Validemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_validemail1 = /** @type {((inputs?: Recovery_Validemail1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Validemail1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_validemail1(inputs)
	if (locale === "es") return es_recovery_validemail1(inputs)
	if (locale === "de") return de_recovery_validemail1(inputs)
	if (locale === "ar") return ar_recovery_validemail1(inputs)
	if (locale === "fr") return fr_recovery_validemail1(inputs)
	return ko_recovery_validemail1(inputs)
});
export { recovery_validemail1 as "recovery.validEmail" }