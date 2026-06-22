/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Received_TitleInputs */

const en_claim_received_title = /** @type {(inputs: Claim_Received_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You've received a credential!`)
};

const es_claim_received_title = /** @type {(inputs: Claim_Received_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Has recibido una credencial!`)
};

const fr_claim_received_title = /** @type {(inputs: Claim_Received_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez reçu un justificatif !`)
};

const ar_claim_received_title = /** @type {(inputs: Claim_Received_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد تلقّيت بيانات اعتماد!`)
};

/**
* | output |
* | --- |
* | "You've received a credential!" |
*
* @param {Claim_Received_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_received_title = /** @type {((inputs?: Claim_Received_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Received_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_received_title(inputs)
	if (locale === "es") return es_claim_received_title(inputs)
	if (locale === "fr") return fr_claim_received_title(inputs)
	return ar_claim_received_title(inputs)
});
export { claim_received_title as "claim.received.title" }