/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Verifycode1Inputs */

const en_recovery_verifycode1 = /** @type {(inputs: Recovery_Verifycode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify Code`)
};

const es_recovery_verifycode1 = /** @type {(inputs: Recovery_Verifycode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificar código`)
};

const de_recovery_verifycode1 = /** @type {(inputs: Recovery_Verifycode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code überprüfen`)
};

const ar_recovery_verifycode1 = /** @type {(inputs: Recovery_Verifycode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من الرمز`)
};

const fr_recovery_verifycode1 = /** @type {(inputs: Recovery_Verifycode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier le code`)
};

const ko_recovery_verifycode1 = /** @type {(inputs: Recovery_Verifycode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`코드 확인`)
};

/**
* | output |
* | --- |
* | "Verify Code" |
*
* @param {Recovery_Verifycode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_verifycode1 = /** @type {((inputs?: Recovery_Verifycode1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Verifycode1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_verifycode1(inputs)
	if (locale === "es") return es_recovery_verifycode1(inputs)
	if (locale === "de") return de_recovery_verifycode1(inputs)
	if (locale === "ar") return ar_recovery_verifycode1(inputs)
	if (locale === "fr") return fr_recovery_verifycode1(inputs)
	return ko_recovery_verifycode1(inputs)
});
export { recovery_verifycode1 as "recovery.verifyCode" }