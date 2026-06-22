/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Sendverificationcode2Inputs */

const en_recovery_sendverificationcode2 = /** @type {(inputs: Recovery_Sendverificationcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Verification Code`)
};

const es_recovery_sendverificationcode2 = /** @type {(inputs: Recovery_Sendverificationcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar código de verificación`)
};

const fr_recovery_sendverificationcode2 = /** @type {(inputs: Recovery_Sendverificationcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer le code de vérification`)
};

const ar_recovery_sendverificationcode2 = /** @type {(inputs: Recovery_Sendverificationcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال رمز التحقق`)
};

/**
* | output |
* | --- |
* | "Send Verification Code" |
*
* @param {Recovery_Sendverificationcode2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_sendverificationcode2 = /** @type {((inputs?: Recovery_Sendverificationcode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Sendverificationcode2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_sendverificationcode2(inputs)
	if (locale === "es") return es_recovery_sendverificationcode2(inputs)
	if (locale === "fr") return fr_recovery_sendverificationcode2(inputs)
	return ar_recovery_sendverificationcode2(inputs)
});
export { recovery_sendverificationcode2 as "recovery.sendVerificationCode" }