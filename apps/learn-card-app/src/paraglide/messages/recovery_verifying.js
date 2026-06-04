/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_VerifyingInputs */

const en_recovery_verifying = /** @type {(inputs: Recovery_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifying...`)
};

const es_recovery_verifying = /** @type {(inputs: Recovery_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificando...`)
};

const de_recovery_verifying = /** @type {(inputs: Recovery_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wird überprüft...`)
};

const ar_recovery_verifying = /** @type {(inputs: Recovery_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التحقق...`)
};

const fr_recovery_verifying = /** @type {(inputs: Recovery_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification...`)
};

const ko_recovery_verifying = /** @type {(inputs: Recovery_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`확인 중...`)
};

/**
* | output |
* | --- |
* | "Verifying..." |
*
* @param {Recovery_VerifyingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_verifying = /** @type {((inputs?: Recovery_VerifyingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_VerifyingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_verifying(inputs)
	if (locale === "es") return es_recovery_verifying(inputs)
	if (locale === "de") return de_recovery_verifying(inputs)
	if (locale === "ar") return ar_recovery_verifying(inputs)
	if (locale === "fr") return fr_recovery_verifying(inputs)
	return ko_recovery_verifying(inputs)
});
export { recovery_verifying as "recovery.verifying" }