/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Qrheading1Inputs */

const en_claim_paste_qrheading1 = /** @type {(inputs: Claim_Paste_Qrheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Got a QR code?`)
};

const es_claim_paste_qrheading1 = /** @type {(inputs: Claim_Paste_Qrheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Tienes un código QR?`)
};

const fr_claim_paste_qrheading1 = /** @type {(inputs: Claim_Paste_Qrheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez un code QR ?`)
};

const ar_claim_paste_qrheading1 = /** @type {(inputs: Claim_Paste_Qrheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل لديك رمز QR؟`)
};

/**
* | output |
* | --- |
* | "Got a QR code?" |
*
* @param {Claim_Paste_Qrheading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_qrheading1 = /** @type {((inputs?: Claim_Paste_Qrheading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Qrheading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_qrheading1(inputs)
	if (locale === "es") return es_claim_paste_qrheading1(inputs)
	if (locale === "fr") return fr_claim_paste_qrheading1(inputs)
	return ar_claim_paste_qrheading1(inputs)
});
export { claim_paste_qrheading1 as "claim.paste.qrHeading" }