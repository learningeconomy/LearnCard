/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_SubtitleInputs */

const en_claim_paste_subtitle = /** @type {(inputs: Claim_Paste_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste a link or upload a QR`)
};

const es_claim_paste_subtitle = /** @type {(inputs: Claim_Paste_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pega un enlace o sube un QR`)
};

const fr_claim_paste_subtitle = /** @type {(inputs: Claim_Paste_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collez un lien ou importez un QR`)
};

const ar_claim_paste_subtitle = /** @type {(inputs: Claim_Paste_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصق رابطًا أو ارفع رمز QR`)
};

/**
* | output |
* | --- |
* | "Paste a link or upload a QR" |
*
* @param {Claim_Paste_SubtitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_subtitle = /** @type {((inputs?: Claim_Paste_SubtitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_SubtitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_subtitle(inputs)
	if (locale === "es") return es_claim_paste_subtitle(inputs)
	if (locale === "fr") return fr_claim_paste_subtitle(inputs)
	return ar_claim_paste_subtitle(inputs)
});
export { claim_paste_subtitle as "claim.paste.subtitle" }