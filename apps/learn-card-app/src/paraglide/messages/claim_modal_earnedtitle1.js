/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Modal_Earnedtitle1Inputs */

const en_claim_modal_earnedtitle1 = /** @type {(inputs: Claim_Modal_Earnedtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You've Earned a Credential!`)
};

const es_claim_modal_earnedtitle1 = /** @type {(inputs: Claim_Modal_Earnedtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Has obtenido una credencial!`)
};

const fr_claim_modal_earnedtitle1 = /** @type {(inputs: Claim_Modal_Earnedtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez obtenu un justificatif !`)
};

const ar_claim_modal_earnedtitle1 = /** @type {(inputs: Claim_Modal_Earnedtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد حصلت على بيانات اعتماد!`)
};

/**
* | output |
* | --- |
* | "You've Earned a Credential!" |
*
* @param {Claim_Modal_Earnedtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_modal_earnedtitle1 = /** @type {((inputs?: Claim_Modal_Earnedtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Modal_Earnedtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_modal_earnedtitle1(inputs)
	if (locale === "es") return es_claim_modal_earnedtitle1(inputs)
	if (locale === "fr") return fr_claim_modal_earnedtitle1(inputs)
	return ar_claim_modal_earnedtitle1(inputs)
});
export { claim_modal_earnedtitle1 as "claim.modal.earnedTitle" }