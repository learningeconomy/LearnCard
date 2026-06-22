/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Linkheading1Inputs */

const en_claim_paste_linkheading1 = /** @type {(inputs: Claim_Paste_Linkheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Got a credential link?`)
};

const es_claim_paste_linkheading1 = /** @type {(inputs: Claim_Paste_Linkheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Tienes un enlace de credencial?`)
};

const fr_claim_paste_linkheading1 = /** @type {(inputs: Claim_Paste_Linkheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez un lien de justificatif ?`)
};

const ar_claim_paste_linkheading1 = /** @type {(inputs: Claim_Paste_Linkheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل لديك رابط بيانات اعتماد؟`)
};

/**
* | output |
* | --- |
* | "Got a credential link?" |
*
* @param {Claim_Paste_Linkheading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_linkheading1 = /** @type {((inputs?: Claim_Paste_Linkheading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Linkheading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_linkheading1(inputs)
	if (locale === "es") return es_claim_paste_linkheading1(inputs)
	if (locale === "fr") return fr_claim_paste_linkheading1(inputs)
	return ar_claim_paste_linkheading1(inputs)
});
export { claim_paste_linkheading1 as "claim.paste.linkHeading" }