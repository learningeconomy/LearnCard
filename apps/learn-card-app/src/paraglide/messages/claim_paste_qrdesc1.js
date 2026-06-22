/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Qrdesc1Inputs */

const en_claim_paste_qrdesc1 = /** @type {(inputs: Claim_Paste_Qrdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Drop an image, or pick one from your device.`)
};

const es_claim_paste_qrdesc1 = /** @type {(inputs: Claim_Paste_Qrdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suelta una imagen o elige una de tu dispositivo.`)
};

const fr_claim_paste_qrdesc1 = /** @type {(inputs: Claim_Paste_Qrdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déposez une image ou choisissez-en une depuis votre appareil.`)
};

const ar_claim_paste_qrdesc1 = /** @type {(inputs: Claim_Paste_Qrdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أفلِت صورة أو اختر واحدة من جهازك.`)
};

/**
* | output |
* | --- |
* | "Drop an image, or pick one from your device." |
*
* @param {Claim_Paste_Qrdesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_qrdesc1 = /** @type {((inputs?: Claim_Paste_Qrdesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Qrdesc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_qrdesc1(inputs)
	if (locale === "es") return es_claim_paste_qrdesc1(inputs)
	if (locale === "fr") return fr_claim_paste_qrdesc1(inputs)
	return ar_claim_paste_qrdesc1(inputs)
});
export { claim_paste_qrdesc1 as "claim.paste.qrDesc" }