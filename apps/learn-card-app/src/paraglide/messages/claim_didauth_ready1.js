/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Didauth_Ready1Inputs */

const en_claim_didauth_ready1 = /** @type {(inputs: Claim_Didauth_Ready1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ready to claim it?`)
};

const es_claim_didauth_ready1 = /** @type {(inputs: Claim_Didauth_Ready1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Listo para reclamarla?`)
};

const fr_claim_didauth_ready1 = /** @type {(inputs: Claim_Didauth_Ready1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prêt à le réclamer ?`)
};

const ar_claim_didauth_ready1 = /** @type {(inputs: Claim_Didauth_Ready1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت مستعد للمطالبة بها؟`)
};

/**
* | output |
* | --- |
* | "Ready to claim it?" |
*
* @param {Claim_Didauth_Ready1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_didauth_ready1 = /** @type {((inputs?: Claim_Didauth_Ready1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Didauth_Ready1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_didauth_ready1(inputs)
	if (locale === "es") return es_claim_didauth_ready1(inputs)
	if (locale === "fr") return fr_claim_didauth_ready1(inputs)
	return ar_claim_didauth_ready1(inputs)
});
export { claim_didauth_ready1 as "claim.didAuth.ready" }