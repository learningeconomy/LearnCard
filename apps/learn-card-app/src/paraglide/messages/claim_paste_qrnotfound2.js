/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Qrnotfound2Inputs */

const en_claim_paste_qrnotfound2 = /** @type {(inputs: Claim_Paste_Qrnotfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We couldn't find a QR code in that image. Make sure the QR fills most of the photo and isn't blurry.`)
};

const es_claim_paste_qrnotfound2 = /** @type {(inputs: Claim_Paste_Qrnotfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No pudimos encontrar un código QR en esa imagen. Asegúrate de que el QR ocupe la mayor parte de la foto y no esté borroso.`)
};

const fr_claim_paste_qrnotfound2 = /** @type {(inputs: Claim_Paste_Qrnotfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous n'avons pas trouvé de code QR dans cette image. Assurez-vous que le QR occupe la majeure partie de la photo et qu'il n'est pas flou.`)
};

const ar_claim_paste_qrnotfound2 = /** @type {(inputs: Claim_Paste_Qrnotfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم نتمكن من العثور على رمز QR في تلك الصورة. تأكد من أن رمز QR يملأ معظم الصورة وأنه غير ضبابي.`)
};

/**
* | output |
* | --- |
* | "We couldn't find a QR code in that image. Make sure the QR fills most of the photo and isn't blurry." |
*
* @param {Claim_Paste_Qrnotfound2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_qrnotfound2 = /** @type {((inputs?: Claim_Paste_Qrnotfound2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Qrnotfound2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_qrnotfound2(inputs)
	if (locale === "es") return es_claim_paste_qrnotfound2(inputs)
	if (locale === "fr") return fr_claim_paste_qrnotfound2(inputs)
	return ar_claim_paste_qrnotfound2(inputs)
});
export { claim_paste_qrnotfound2 as "claim.paste.qrNotFound" }