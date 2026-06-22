/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_TitleInputs */

const en_claim_paste_title = /** @type {(inputs: Claim_Paste_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use a Claim Link`)
};

const es_claim_paste_title = /** @type {(inputs: Claim_Paste_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usar un enlace de reclamación`)
};

const fr_claim_paste_title = /** @type {(inputs: Claim_Paste_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utiliser un lien de réclamation`)
};

const ar_claim_paste_title = /** @type {(inputs: Claim_Paste_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدام رابط مطالبة`)
};

/**
* | output |
* | --- |
* | "Use a Claim Link" |
*
* @param {Claim_Paste_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_title = /** @type {((inputs?: Claim_Paste_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_title(inputs)
	if (locale === "es") return es_claim_paste_title(inputs)
	if (locale === "fr") return fr_claim_paste_title(inputs)
	return ar_claim_paste_title(inputs)
});
export { claim_paste_title as "claim.paste.title" }