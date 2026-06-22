/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Modal_PreparingInputs */

const en_claim_modal_preparing = /** @type {(inputs: Claim_Modal_PreparingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preparing...`)
};

const es_claim_modal_preparing = /** @type {(inputs: Claim_Modal_PreparingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preparando...`)
};

const fr_claim_modal_preparing = /** @type {(inputs: Claim_Modal_PreparingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Préparation...`)
};

const ar_claim_modal_preparing = /** @type {(inputs: Claim_Modal_PreparingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التحضير...`)
};

/**
* | output |
* | --- |
* | "Preparing..." |
*
* @param {Claim_Modal_PreparingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_modal_preparing = /** @type {((inputs?: Claim_Modal_PreparingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Modal_PreparingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_modal_preparing(inputs)
	if (locale === "es") return es_claim_modal_preparing(inputs)
	if (locale === "fr") return fr_claim_modal_preparing(inputs)
	return ar_claim_modal_preparing(inputs)
});
export { claim_modal_preparing as "claim.modal.preparing" }