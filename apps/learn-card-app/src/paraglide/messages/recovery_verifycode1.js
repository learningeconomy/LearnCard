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

const fr_recovery_verifycode1 = /** @type {(inputs: Recovery_Verifycode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier le code`)
};

const ar_recovery_verifycode1 = /** @type {(inputs: Recovery_Verifycode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من الرمز`)
};

/**
* | output |
* | --- |
* | "Verify Code" |
*
* @param {Recovery_Verifycode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_verifycode1 = /** @type {((inputs?: Recovery_Verifycode1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Verifycode1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_verifycode1(inputs)
	if (locale === "es") return es_recovery_verifycode1(inputs)
	if (locale === "fr") return fr_recovery_verifycode1(inputs)
	return ar_recovery_verifycode1(inputs)
});
export { recovery_verifycode1 as "recovery.verifyCode" }