/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Verificationcode1Inputs */

const en_recovery_verificationcode1 = /** @type {(inputs: Recovery_Verificationcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verification Code`)
};

const es_recovery_verificationcode1 = /** @type {(inputs: Recovery_Verificationcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código de verificación`)
};

const fr_recovery_verificationcode1 = /** @type {(inputs: Recovery_Verificationcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code de vérification`)
};

const ar_recovery_verificationcode1 = /** @type {(inputs: Recovery_Verificationcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز التحقق`)
};

/**
* | output |
* | --- |
* | "Verification Code" |
*
* @param {Recovery_Verificationcode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_verificationcode1 = /** @type {((inputs?: Recovery_Verificationcode1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Verificationcode1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_verificationcode1(inputs)
	if (locale === "es") return es_recovery_verificationcode1(inputs)
	if (locale === "fr") return fr_recovery_verificationcode1(inputs)
	return ar_recovery_verificationcode1(inputs)
});
export { recovery_verificationcode1 as "recovery.verificationCode" }