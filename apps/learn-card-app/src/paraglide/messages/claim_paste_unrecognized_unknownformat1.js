/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Unrecognized_Unknownformat1Inputs */

const en_claim_paste_unrecognized_unknownformat1 = /** @type {(inputs: Claim_Paste_Unrecognized_Unknownformat1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We couldn't make sense of that. Paste a claim link or upload a QR code image.`)
};

const es_claim_paste_unrecognized_unknownformat1 = /** @type {(inputs: Claim_Paste_Unrecognized_Unknownformat1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No pudimos interpretar eso. Pega un enlace de reclamación o sube una imagen de código QR.`)
};

const fr_claim_paste_unrecognized_unknownformat1 = /** @type {(inputs: Claim_Paste_Unrecognized_Unknownformat1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous n'avons pas pu interpréter cela. Collez un lien de réclamation ou importez une image de code QR.`)
};

const ar_claim_paste_unrecognized_unknownformat1 = /** @type {(inputs: Claim_Paste_Unrecognized_Unknownformat1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم نتمكن من فهم ذلك. الصق رابط مطالبة أو ارفع صورة رمز QR.`)
};

/**
* | output |
* | --- |
* | "We couldn't make sense of that. Paste a claim link or upload a QR code image." |
*
* @param {Claim_Paste_Unrecognized_Unknownformat1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_unrecognized_unknownformat1 = /** @type {((inputs?: Claim_Paste_Unrecognized_Unknownformat1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Unrecognized_Unknownformat1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_unrecognized_unknownformat1(inputs)
	if (locale === "es") return es_claim_paste_unrecognized_unknownformat1(inputs)
	if (locale === "fr") return fr_claim_paste_unrecognized_unknownformat1(inputs)
	return ar_claim_paste_unrecognized_unknownformat1(inputs)
});
export { claim_paste_unrecognized_unknownformat1 as "claim.paste.unrecognized.unknownFormat" }