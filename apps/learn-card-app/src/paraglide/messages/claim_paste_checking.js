/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_CheckingInputs */

const en_claim_paste_checking = /** @type {(inputs: Claim_Paste_CheckingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking…`)
};

const es_claim_paste_checking = /** @type {(inputs: Claim_Paste_CheckingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comprobando…`)
};

const fr_claim_paste_checking = /** @type {(inputs: Claim_Paste_CheckingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification…`)
};

const ar_claim_paste_checking = /** @type {(inputs: Claim_Paste_CheckingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التحقق…`)
};

/**
* | output |
* | --- |
* | "Checking…" |
*
* @param {Claim_Paste_CheckingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_checking = /** @type {((inputs?: Claim_Paste_CheckingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_CheckingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_checking(inputs)
	if (locale === "es") return es_claim_paste_checking(inputs)
	if (locale === "fr") return fr_claim_paste_checking(inputs)
	return ar_claim_paste_checking(inputs)
});
export { claim_paste_checking as "claim.paste.checking" }