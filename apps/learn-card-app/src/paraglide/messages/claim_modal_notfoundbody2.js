/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Modal_Notfoundbody2Inputs */

const en_claim_modal_notfoundbody2 = /** @type {(inputs: Claim_Modal_Notfoundbody2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The credential could not be found.`)
};

const es_claim_modal_notfoundbody2 = /** @type {(inputs: Claim_Modal_Notfoundbody2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo encontrar la credencial.`)
};

const fr_claim_modal_notfoundbody2 = /** @type {(inputs: Claim_Modal_Notfoundbody2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le justificatif est introuvable.`)
};

const ar_claim_modal_notfoundbody2 = /** @type {(inputs: Claim_Modal_Notfoundbody2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذّر العثور على بيانات الاعتماد.`)
};

/**
* | output |
* | --- |
* | "The credential could not be found." |
*
* @param {Claim_Modal_Notfoundbody2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_modal_notfoundbody2 = /** @type {((inputs?: Claim_Modal_Notfoundbody2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Modal_Notfoundbody2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_modal_notfoundbody2(inputs)
	if (locale === "es") return es_claim_modal_notfoundbody2(inputs)
	if (locale === "fr") return fr_claim_modal_notfoundbody2(inputs)
	return ar_claim_modal_notfoundbody2(inputs)
});
export { claim_modal_notfoundbody2 as "claim.modal.notFoundBody" }