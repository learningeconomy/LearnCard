/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Modal_Loaderrortitle2Inputs */

const en_claim_modal_loaderrortitle2 = /** @type {(inputs: Claim_Modal_Loaderrortitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to Load Credential`)
};

const es_claim_modal_loaderrortitle2 = /** @type {(inputs: Claim_Modal_Loaderrortitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo cargar la credencial`)
};

const fr_claim_modal_loaderrortitle2 = /** @type {(inputs: Claim_Modal_Loaderrortitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de charger le justificatif`)
};

const ar_claim_modal_loaderrortitle2 = /** @type {(inputs: Claim_Modal_Loaderrortitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذّر تحميل بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Unable to Load Credential" |
*
* @param {Claim_Modal_Loaderrortitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_modal_loaderrortitle2 = /** @type {((inputs?: Claim_Modal_Loaderrortitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Modal_Loaderrortitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_modal_loaderrortitle2(inputs)
	if (locale === "es") return es_claim_modal_loaderrortitle2(inputs)
	if (locale === "fr") return fr_claim_modal_loaderrortitle2(inputs)
	return ar_claim_modal_loaderrortitle2(inputs)
});
export { claim_modal_loaderrortitle2 as "claim.modal.loadErrorTitle" }