/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Didauth_Intro1Inputs */

const en_claim_didauth_intro1 = /** @type {(inputs: Claim_Didauth_Intro1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`To receive this credential, you'll need to confirm your identity. This lets the issuer securely deliver it to your wallet.`)
};

const es_claim_didauth_intro1 = /** @type {(inputs: Claim_Didauth_Intro1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Para recibir esta credencial, deberás confirmar tu identidad. Esto permite que el emisor te la entregue de forma segura en tu cartera.`)
};

const fr_claim_didauth_intro1 = /** @type {(inputs: Claim_Didauth_Intro1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pour recevoir ce justificatif, vous devrez confirmer votre identité. Cela permet à l'émetteur de vous le remettre en toute sécurité dans votre portefeuille.`)
};

const ar_claim_didauth_intro1 = /** @type {(inputs: Claim_Didauth_Intro1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لتلقّي بيانات الاعتماد هذه، ستحتاج إلى تأكيد هويتك. يتيح ذلك للجهة المُصدِرة تسليمها بأمان إلى محفظتك.`)
};

/**
* | output |
* | --- |
* | "To receive this credential, you'll need to confirm your identity. This lets the issuer securely deliver it to your wallet." |
*
* @param {Claim_Didauth_Intro1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_didauth_intro1 = /** @type {((inputs?: Claim_Didauth_Intro1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Didauth_Intro1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_didauth_intro1(inputs)
	if (locale === "es") return es_claim_didauth_intro1(inputs)
	if (locale === "fr") return fr_claim_didauth_intro1(inputs)
	return ar_claim_didauth_intro1(inputs)
});
export { claim_didauth_intro1 as "claim.didAuth.intro" }