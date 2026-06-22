/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Chooseimage1Inputs */

const en_claim_paste_chooseimage1 = /** @type {(inputs: Claim_Paste_Chooseimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose an image`)
};

const es_claim_paste_chooseimage1 = /** @type {(inputs: Claim_Paste_Chooseimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elegir una imagen`)
};

const fr_claim_paste_chooseimage1 = /** @type {(inputs: Claim_Paste_Chooseimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisir une image`)
};

const ar_claim_paste_chooseimage1 = /** @type {(inputs: Claim_Paste_Chooseimage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر صورة`)
};

/**
* | output |
* | --- |
* | "Choose an image" |
*
* @param {Claim_Paste_Chooseimage1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_chooseimage1 = /** @type {((inputs?: Claim_Paste_Chooseimage1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Chooseimage1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_chooseimage1(inputs)
	if (locale === "es") return es_claim_paste_chooseimage1(inputs)
	if (locale === "fr") return fr_claim_paste_chooseimage1(inputs)
	return ar_claim_paste_chooseimage1(inputs)
});
export { claim_paste_chooseimage1 as "claim.paste.chooseImage" }