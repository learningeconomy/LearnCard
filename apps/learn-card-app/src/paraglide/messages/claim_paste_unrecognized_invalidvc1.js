/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Unrecognized_Invalidvc1Inputs */

const en_claim_paste_unrecognized_invalidvc1 = /** @type {(inputs: Claim_Paste_Unrecognized_Invalidvc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`That looks like a credential, but we couldn't read it. Ask the issuer for a fresh copy.`)
};

const es_claim_paste_unrecognized_invalidvc1 = /** @type {(inputs: Claim_Paste_Unrecognized_Invalidvc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eso parece una credencial, pero no pudimos leerla. Pídele al emisor una copia nueva.`)
};

const fr_claim_paste_unrecognized_invalidvc1 = /** @type {(inputs: Claim_Paste_Unrecognized_Invalidvc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cela ressemble à un justificatif, mais nous n'avons pas pu le lire. Demandez une nouvelle copie à l'émetteur.`)
};

const ar_claim_paste_unrecognized_invalidvc1 = /** @type {(inputs: Claim_Paste_Unrecognized_Invalidvc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يبدو هذا كبيانات اعتماد، لكن لم نتمكن من قراءتها. اطلب نسخة جديدة من الجهة المُصدِرة.`)
};

/**
* | output |
* | --- |
* | "That looks like a credential, but we couldn't read it. Ask the issuer for a fresh copy." |
*
* @param {Claim_Paste_Unrecognized_Invalidvc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_unrecognized_invalidvc1 = /** @type {((inputs?: Claim_Paste_Unrecognized_Invalidvc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Unrecognized_Invalidvc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_unrecognized_invalidvc1(inputs)
	if (locale === "es") return es_claim_paste_unrecognized_invalidvc1(inputs)
	if (locale === "fr") return fr_claim_paste_unrecognized_invalidvc1(inputs)
	return ar_claim_paste_unrecognized_invalidvc1(inputs)
});
export { claim_paste_unrecognized_invalidvc1 as "claim.paste.unrecognized.invalidVc" }