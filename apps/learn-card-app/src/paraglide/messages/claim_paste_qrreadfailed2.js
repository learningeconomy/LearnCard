/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Qrreadfailed2Inputs */

const en_claim_paste_qrreadfailed2 = /** @type {(inputs: Claim_Paste_Qrreadfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We couldn't read a QR code from that image. Try a clearer photo, or paste the link instead.`)
};

const es_claim_paste_qrreadfailed2 = /** @type {(inputs: Claim_Paste_Qrreadfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No pudimos leer un código QR de esa imagen. Prueba con una foto más nítida o pega el enlace en su lugar.`)
};

const fr_claim_paste_qrreadfailed2 = /** @type {(inputs: Claim_Paste_Qrreadfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous n'avons pas pu lire de code QR dans cette image. Essayez une photo plus nette ou collez plutôt le lien.`)
};

const ar_claim_paste_qrreadfailed2 = /** @type {(inputs: Claim_Paste_Qrreadfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم نتمكن من قراءة رمز QR من تلك الصورة. جرّب صورة أوضح أو الصق الرابط بدلًا من ذلك.`)
};

/**
* | output |
* | --- |
* | "We couldn't read a QR code from that image. Try a clearer photo, or paste the link instead." |
*
* @param {Claim_Paste_Qrreadfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_qrreadfailed2 = /** @type {((inputs?: Claim_Paste_Qrreadfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Qrreadfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_qrreadfailed2(inputs)
	if (locale === "es") return es_claim_paste_qrreadfailed2(inputs)
	if (locale === "fr") return fr_claim_paste_qrreadfailed2(inputs)
	return ar_claim_paste_qrreadfailed2(inputs)
});
export { claim_paste_qrreadfailed2 as "claim.paste.qrReadFailed" }