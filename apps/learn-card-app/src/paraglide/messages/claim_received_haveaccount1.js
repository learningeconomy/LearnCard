/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Received_Haveaccount1Inputs */

const en_claim_received_haveaccount1 = /** @type {(inputs: Claim_Received_Haveaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Have an account?`)
};

const es_claim_received_haveaccount1 = /** @type {(inputs: Claim_Received_Haveaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Ya tienes una cuenta?`)
};

const fr_claim_received_haveaccount1 = /** @type {(inputs: Claim_Received_Haveaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez déjà un compte ?`)
};

const ar_claim_received_haveaccount1 = /** @type {(inputs: Claim_Received_Haveaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل لديك حساب؟`)
};

/**
* | output |
* | --- |
* | "Have an account?" |
*
* @param {Claim_Received_Haveaccount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_received_haveaccount1 = /** @type {((inputs?: Claim_Received_Haveaccount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Received_Haveaccount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_received_haveaccount1(inputs)
	if (locale === "es") return es_claim_received_haveaccount1(inputs)
	if (locale === "fr") return fr_claim_received_haveaccount1(inputs)
	return ar_claim_received_haveaccount1(inputs)
});
export { claim_received_haveaccount1 as "claim.received.haveAccount" }