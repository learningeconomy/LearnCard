/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Didauth_Privacy1Inputs */

const en_claim_didauth_privacy1 = /** @type {(inputs: Claim_Didauth_Privacy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your identity is only shared with the issuer to complete this exchange. You're always in control of your data.`)
};

const es_claim_didauth_privacy1 = /** @type {(inputs: Claim_Didauth_Privacy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu identidad solo se comparte con el emisor para completar este intercambio. Siempre tienes el control de tus datos.`)
};

const fr_claim_didauth_privacy1 = /** @type {(inputs: Claim_Didauth_Privacy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre identité n'est partagée qu'avec l'émetteur pour finaliser cet échange. Vous gardez toujours le contrôle de vos données.`)
};

const ar_claim_didauth_privacy1 = /** @type {(inputs: Claim_Didauth_Privacy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تتم مشاركة هويتك مع الجهة المُصدِرة فقط لإتمام هذا التبادل. تظل دائمًا متحكمًا في بياناتك.`)
};

/**
* | output |
* | --- |
* | "Your identity is only shared with the issuer to complete this exchange. You're always in control of your data." |
*
* @param {Claim_Didauth_Privacy1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_didauth_privacy1 = /** @type {((inputs?: Claim_Didauth_Privacy1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Didauth_Privacy1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_didauth_privacy1(inputs)
	if (locale === "es") return es_claim_didauth_privacy1(inputs)
	if (locale === "fr") return fr_claim_didauth_privacy1(inputs)
	return ar_claim_didauth_privacy1(inputs)
});
export { claim_didauth_privacy1 as "claim.didAuth.privacy" }