/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Unrecognized_EmptyInputs */

const en_claim_paste_unrecognized_empty = /** @type {(inputs: Claim_Paste_Unrecognized_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste a link or upload a QR code image to continue.`)
};

const es_claim_paste_unrecognized_empty = /** @type {(inputs: Claim_Paste_Unrecognized_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pega un enlace o sube una imagen de código QR para continuar.`)
};

const fr_claim_paste_unrecognized_empty = /** @type {(inputs: Claim_Paste_Unrecognized_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collez un lien ou importez une image de code QR pour continuer.`)
};

const ar_claim_paste_unrecognized_empty = /** @type {(inputs: Claim_Paste_Unrecognized_EmptyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصق رابطًا أو ارفع صورة رمز QR للمتابعة.`)
};

/**
* | output |
* | --- |
* | "Paste a link or upload a QR code image to continue." |
*
* @param {Claim_Paste_Unrecognized_EmptyInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_unrecognized_empty = /** @type {((inputs?: Claim_Paste_Unrecognized_EmptyInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Unrecognized_EmptyInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_unrecognized_empty(inputs)
	if (locale === "es") return es_claim_paste_unrecognized_empty(inputs)
	if (locale === "fr") return fr_claim_paste_unrecognized_empty(inputs)
	return ar_claim_paste_unrecognized_empty(inputs)
});
export { claim_paste_unrecognized_empty as "claim.paste.unrecognized.empty" }