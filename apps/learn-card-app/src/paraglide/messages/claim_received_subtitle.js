/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Received_SubtitleInputs */

const en_claim_received_subtitle = /** @type {(inputs: Claim_Received_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Login or signup to claim.`)
};

const es_claim_received_subtitle = /** @type {(inputs: Claim_Received_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicia sesión o regístrate para reclamarla.`)
};

const fr_claim_received_subtitle = /** @type {(inputs: Claim_Received_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez-vous ou inscrivez-vous pour le réclamer.`)
};

const ar_claim_received_subtitle = /** @type {(inputs: Claim_Received_SubtitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجّل الدخول أو أنشئ حسابًا للمطالبة بها.`)
};

/**
* | output |
* | --- |
* | "Login or signup to claim." |
*
* @param {Claim_Received_SubtitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_received_subtitle = /** @type {((inputs?: Claim_Received_SubtitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Received_SubtitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_received_subtitle(inputs)
	if (locale === "es") return es_claim_received_subtitle(inputs)
	if (locale === "fr") return fr_claim_received_subtitle(inputs)
	return ar_claim_received_subtitle(inputs)
});
export { claim_received_subtitle as "claim.received.subtitle" }