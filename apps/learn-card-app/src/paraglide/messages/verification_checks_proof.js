/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Verification_Checks_ProofInputs */

const en_verification_checks_proof = /** @type {(inputs: Verification_Checks_ProofInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Proof`)
};

const es_verification_checks_proof = /** @type {(inputs: Verification_Checks_ProofInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prueba`)
};

const fr_verification_checks_proof = /** @type {(inputs: Verification_Checks_ProofInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preuve`)
};

const ar_verification_checks_proof = /** @type {(inputs: Verification_Checks_ProofInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إثبات`)
};

/**
* | output |
* | --- |
* | "Proof" |
*
* @param {Verification_Checks_ProofInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const verification_checks_proof = /** @type {((inputs?: Verification_Checks_ProofInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Verification_Checks_ProofInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_verification_checks_proof(inputs)
	if (locale === "es") return es_verification_checks_proof(inputs)
	if (locale === "fr") return fr_verification_checks_proof(inputs)
	return ar_verification_checks_proof(inputs)
});
export { verification_checks_proof as "verification.checks.proof" }