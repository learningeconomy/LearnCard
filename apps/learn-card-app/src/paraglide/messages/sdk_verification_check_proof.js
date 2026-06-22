/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sdk_Verification_Check_ProofInputs */

const en_sdk_verification_check_proof = /** @type {(inputs: Sdk_Verification_Check_ProofInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Proof`)
};

const es_sdk_verification_check_proof = /** @type {(inputs: Sdk_Verification_Check_ProofInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prueba`)
};

const fr_sdk_verification_check_proof = /** @type {(inputs: Sdk_Verification_Check_ProofInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preuve`)
};

const ar_sdk_verification_check_proof = /** @type {(inputs: Sdk_Verification_Check_ProofInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإثبات`)
};

/**
* | output |
* | --- |
* | "Proof" |
*
* @param {Sdk_Verification_Check_ProofInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sdk_verification_check_proof = /** @type {((inputs?: Sdk_Verification_Check_ProofInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sdk_Verification_Check_ProofInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sdk_verification_check_proof(inputs)
	if (locale === "es") return es_sdk_verification_check_proof(inputs)
	if (locale === "fr") return fr_sdk_verification_check_proof(inputs)
	return ar_sdk_verification_check_proof(inputs)
});
export { sdk_verification_check_proof as "sdk.verification.check.proof" }