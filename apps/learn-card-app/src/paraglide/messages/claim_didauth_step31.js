/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Didauth_Step31Inputs */

const en_claim_didauth_step31 = /** @type {(inputs: Claim_Didauth_Step31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You own and control this credential forever`)
};

const es_claim_didauth_step31 = /** @type {(inputs: Claim_Didauth_Step31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eres dueño y controlas esta credencial para siempre`)
};

const fr_claim_didauth_step31 = /** @type {(inputs: Claim_Didauth_Step31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous possédez et contrôlez ce justificatif pour toujours`)
};

const ar_claim_didauth_step31 = /** @type {(inputs: Claim_Didauth_Step31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمتلك بيانات الاعتماد هذه وتتحكم بها إلى الأبد`)
};

/**
* | output |
* | --- |
* | "You own and control this credential forever" |
*
* @param {Claim_Didauth_Step31Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_didauth_step31 = /** @type {((inputs?: Claim_Didauth_Step31Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Didauth_Step31Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_didauth_step31(inputs)
	if (locale === "es") return es_claim_didauth_step31(inputs)
	if (locale === "fr") return fr_claim_didauth_step31(inputs)
	return ar_claim_didauth_step31(inputs)
});
export { claim_didauth_step31 as "claim.didAuth.step3" }