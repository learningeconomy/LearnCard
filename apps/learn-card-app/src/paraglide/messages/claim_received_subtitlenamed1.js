/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Claim_Received_Subtitlenamed1Inputs */

const en_claim_received_subtitlenamed1 = /** @type {(inputs: Claim_Received_Subtitlenamed1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Login or signup to claim your ${i?.name}.`)
};

const es_claim_received_subtitlenamed1 = /** @type {(inputs: Claim_Received_Subtitlenamed1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Inicia sesión o regístrate para reclamar tu ${i?.name}.`)
};

const fr_claim_received_subtitlenamed1 = /** @type {(inputs: Claim_Received_Subtitlenamed1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Connectez-vous ou inscrivez-vous pour réclamer votre ${i?.name}.`)
};

const ar_claim_received_subtitlenamed1 = /** @type {(inputs: Claim_Received_Subtitlenamed1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`سجّل الدخول أو أنشئ حسابًا للمطالبة بـ ${i?.name}.`)
};

/**
* | output |
* | --- |
* | "Login or signup to claim your {name}." |
*
* @param {Claim_Received_Subtitlenamed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_received_subtitlenamed1 = /** @type {((inputs: Claim_Received_Subtitlenamed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Received_Subtitlenamed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_received_subtitlenamed1(inputs)
	if (locale === "es") return es_claim_received_subtitlenamed1(inputs)
	if (locale === "fr") return fr_claim_received_subtitlenamed1(inputs)
	return ar_claim_received_subtitlenamed1(inputs)
});
export { claim_received_subtitlenamed1 as "claim.received.subtitleNamed" }