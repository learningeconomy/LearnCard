/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Linkdesc1Inputs */

const en_claim_paste_linkdesc1 = /** @type {(inputs: Claim_Paste_Linkdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste it below to continue.`)
};

const es_claim_paste_linkdesc1 = /** @type {(inputs: Claim_Paste_Linkdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pégalo abajo para continuar.`)
};

const fr_claim_paste_linkdesc1 = /** @type {(inputs: Claim_Paste_Linkdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collez-le ci-dessous pour continuer.`)
};

const ar_claim_paste_linkdesc1 = /** @type {(inputs: Claim_Paste_Linkdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصقه أدناه للمتابعة.`)
};

/**
* | output |
* | --- |
* | "Paste it below to continue." |
*
* @param {Claim_Paste_Linkdesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_linkdesc1 = /** @type {((inputs?: Claim_Paste_Linkdesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Linkdesc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_linkdesc1(inputs)
	if (locale === "es") return es_claim_paste_linkdesc1(inputs)
	if (locale === "fr") return fr_claim_paste_linkdesc1(inputs)
	return ar_claim_paste_linkdesc1(inputs)
});
export { claim_paste_linkdesc1 as "claim.paste.linkDesc" }