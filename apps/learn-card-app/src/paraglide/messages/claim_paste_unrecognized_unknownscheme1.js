/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Unrecognized_Unknownscheme1Inputs */

const en_claim_paste_unrecognized_unknownscheme1 = /** @type {(inputs: Claim_Paste_Unrecognized_Unknownscheme1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We don't recognize this kind of link yet. The link looks valid, but the format isn't supported.`)
};

const es_claim_paste_unrecognized_unknownscheme1 = /** @type {(inputs: Claim_Paste_Unrecognized_Unknownscheme1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no reconocemos este tipo de enlace. El enlace parece válido, pero el formato no es compatible.`)
};

const fr_claim_paste_unrecognized_unknownscheme1 = /** @type {(inputs: Claim_Paste_Unrecognized_Unknownscheme1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous ne reconnaissons pas encore ce type de lien. Le lien semble valide, mais le format n'est pas pris en charge.`)
};

const ar_claim_paste_unrecognized_unknownscheme1 = /** @type {(inputs: Claim_Paste_Unrecognized_Unknownscheme1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا نتعرّف على هذا النوع من الروابط بعد. يبدو الرابط صالحًا، لكن التنسيق غير مدعوم.`)
};

/**
* | output |
* | --- |
* | "We don't recognize this kind of link yet. The link looks valid, but the format isn't supported." |
*
* @param {Claim_Paste_Unrecognized_Unknownscheme1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_unrecognized_unknownscheme1 = /** @type {((inputs?: Claim_Paste_Unrecognized_Unknownscheme1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Unrecognized_Unknownscheme1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_unrecognized_unknownscheme1(inputs)
	if (locale === "es") return es_claim_paste_unrecognized_unknownscheme1(inputs)
	if (locale === "fr") return fr_claim_paste_unrecognized_unknownscheme1(inputs)
	return ar_claim_paste_unrecognized_unknownscheme1(inputs)
});
export { claim_paste_unrecognized_unknownscheme1 as "claim.paste.unrecognized.unknownScheme" }