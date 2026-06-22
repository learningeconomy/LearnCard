/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Dropit1Inputs */

const en_claim_paste_dropit1 = /** @type {(inputs: Claim_Paste_Dropit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Drop it!`)
};

const es_claim_paste_dropit1 = /** @type {(inputs: Claim_Paste_Dropit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Suéltalo!`)
};

const fr_claim_paste_dropit1 = /** @type {(inputs: Claim_Paste_Dropit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déposez-le !`)
};

const ar_claim_paste_dropit1 = /** @type {(inputs: Claim_Paste_Dropit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أفلِتها!`)
};

/**
* | output |
* | --- |
* | "Drop it!" |
*
* @param {Claim_Paste_Dropit1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_dropit1 = /** @type {((inputs?: Claim_Paste_Dropit1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Dropit1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_dropit1(inputs)
	if (locale === "es") return es_claim_paste_dropit1(inputs)
	if (locale === "fr") return fr_claim_paste_dropit1(inputs)
	return ar_claim_paste_dropit1(inputs)
});
export { claim_paste_dropit1 as "claim.paste.dropIt" }