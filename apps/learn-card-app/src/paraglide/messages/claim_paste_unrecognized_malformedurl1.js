/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Unrecognized_Malformedurl1Inputs */

const en_claim_paste_unrecognized_malformedurl1 = /** @type {(inputs: Claim_Paste_Unrecognized_Malformedurl1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`That doesn't look like a claim link. Try copying the whole link, starting with https://, openid-credential-offer://, or similar.`)
};

const es_claim_paste_unrecognized_malformedurl1 = /** @type {(inputs: Claim_Paste_Unrecognized_Malformedurl1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eso no parece un enlace de reclamación. Intenta copiar el enlace completo, que comience con https://, openid-credential-offer:// o similar.`)
};

const fr_claim_paste_unrecognized_malformedurl1 = /** @type {(inputs: Claim_Paste_Unrecognized_Malformedurl1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cela ne ressemble pas à un lien de réclamation. Essayez de copier le lien entier, commençant par https://, openid-credential-offer:// ou similaire.`)
};

const ar_claim_paste_unrecognized_malformedurl1 = /** @type {(inputs: Claim_Paste_Unrecognized_Malformedurl1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هذا لا يبدو كرابط مطالبة. حاول نسخ الرابط بالكامل، بدءًا من https:// أو openid-credential-offer:// أو ما شابه.`)
};

/**
* | output |
* | --- |
* | "That doesn't look like a claim link. Try copying the whole link, starting with https://, openid-credential-offer://, or similar." |
*
* @param {Claim_Paste_Unrecognized_Malformedurl1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_unrecognized_malformedurl1 = /** @type {((inputs?: Claim_Paste_Unrecognized_Malformedurl1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Unrecognized_Malformedurl1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_unrecognized_malformedurl1(inputs)
	if (locale === "es") return es_claim_paste_unrecognized_malformedurl1(inputs)
	if (locale === "fr") return fr_claim_paste_unrecognized_malformedurl1(inputs)
	return ar_claim_paste_unrecognized_malformedurl1(inputs)
});
export { claim_paste_unrecognized_malformedurl1 as "claim.paste.unrecognized.malformedUrl" }