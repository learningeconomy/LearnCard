/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Didauth_Loginrequired2Inputs */

const en_claim_didauth_loginrequired2 = /** @type {(inputs: Claim_Didauth_Loginrequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please log in to continue.`)
};

const es_claim_didauth_loginrequired2 = /** @type {(inputs: Claim_Didauth_Loginrequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicia sesión para continuar.`)
};

const fr_claim_didauth_loginrequired2 = /** @type {(inputs: Claim_Didauth_Loginrequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez vous connecter pour continuer.`)
};

const ar_claim_didauth_loginrequired2 = /** @type {(inputs: Claim_Didauth_Loginrequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى تسجيل الدخول للمتابعة.`)
};

/**
* | output |
* | --- |
* | "Please log in to continue." |
*
* @param {Claim_Didauth_Loginrequired2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_didauth_loginrequired2 = /** @type {((inputs?: Claim_Didauth_Loginrequired2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Didauth_Loginrequired2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_didauth_loginrequired2(inputs)
	if (locale === "es") return es_claim_didauth_loginrequired2(inputs)
	if (locale === "fr") return fr_claim_didauth_loginrequired2(inputs)
	return ar_claim_didauth_loginrequired2(inputs)
});
export { claim_didauth_loginrequired2 as "claim.didAuth.loginRequired" }