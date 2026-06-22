/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Didauth_Claimbutton2Inputs */

const en_claim_didauth_claimbutton2 = /** @type {(inputs: Claim_Didauth_Claimbutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claim My Credential`)
};

const es_claim_didauth_claimbutton2 = /** @type {(inputs: Claim_Didauth_Claimbutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reclamar mi credencial`)
};

const fr_claim_didauth_claimbutton2 = /** @type {(inputs: Claim_Didauth_Claimbutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réclamer mon justificatif`)
};

const ar_claim_didauth_claimbutton2 = /** @type {(inputs: Claim_Didauth_Claimbutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المطالبة ببيانات الاعتماد الخاصة بي`)
};

/**
* | output |
* | --- |
* | "Claim My Credential" |
*
* @param {Claim_Didauth_Claimbutton2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_didauth_claimbutton2 = /** @type {((inputs?: Claim_Didauth_Claimbutton2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Didauth_Claimbutton2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_didauth_claimbutton2(inputs)
	if (locale === "es") return es_claim_didauth_claimbutton2(inputs)
	if (locale === "fr") return fr_claim_didauth_claimbutton2(inputs)
	return ar_claim_didauth_claimbutton2(inputs)
});
export { claim_didauth_claimbutton2 as "claim.didAuth.claimButton" }