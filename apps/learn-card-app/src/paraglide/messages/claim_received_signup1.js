/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Claim_Received_Signup1Inputs */

const en_claim_received_signup1 = /** @type {(inputs: Claim_Received_Signup1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Sign up for ${i?.brand}`)
};

const es_claim_received_signup1 = /** @type {(inputs: Claim_Received_Signup1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Regístrate en ${i?.brand}`)
};

const fr_claim_received_signup1 = /** @type {(inputs: Claim_Received_Signup1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Inscrivez-vous à ${i?.brand}`)
};

const ar_claim_received_signup1 = /** @type {(inputs: Claim_Received_Signup1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`أنشئ حسابًا في ${i?.brand}`)
};

/**
* | output |
* | --- |
* | "Sign up for {brand}" |
*
* @param {Claim_Received_Signup1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_received_signup1 = /** @type {((inputs: Claim_Received_Signup1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Received_Signup1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_received_signup1(inputs)
	if (locale === "es") return es_claim_received_signup1(inputs)
	if (locale === "fr") return fr_claim_received_signup1(inputs)
	return ar_claim_received_signup1(inputs)
});
export { claim_received_signup1 as "claim.received.signUp" }