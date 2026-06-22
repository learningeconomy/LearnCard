/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Releasetoupload2Inputs */

const en_claim_paste_releasetoupload2 = /** @type {(inputs: Claim_Paste_Releasetoupload2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Release to upload`)
};

const es_claim_paste_releasetoupload2 = /** @type {(inputs: Claim_Paste_Releasetoupload2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suelta para subir`)
};

const fr_claim_paste_releasetoupload2 = /** @type {(inputs: Claim_Paste_Releasetoupload2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Relâchez pour importer`)
};

const ar_claim_paste_releasetoupload2 = /** @type {(inputs: Claim_Paste_Releasetoupload2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أفلِت للرفع`)
};

/**
* | output |
* | --- |
* | "Release to upload" |
*
* @param {Claim_Paste_Releasetoupload2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_releasetoupload2 = /** @type {((inputs?: Claim_Paste_Releasetoupload2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Releasetoupload2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_releasetoupload2(inputs)
	if (locale === "es") return es_claim_paste_releasetoupload2(inputs)
	if (locale === "fr") return fr_claim_paste_releasetoupload2(inputs)
	return ar_claim_paste_releasetoupload2(inputs)
});
export { claim_paste_releasetoupload2 as "claim.paste.releaseToUpload" }