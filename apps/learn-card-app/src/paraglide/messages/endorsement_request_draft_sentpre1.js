/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Draft_Sentpre1Inputs */

const en_endorsement_request_draft_sentpre1 = /** @type {(inputs: Endorsement_Request_Draft_Sentpre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Thanks!`)
};

const es_endorsement_request_draft_sentpre1 = /** @type {(inputs: Endorsement_Request_Draft_Sentpre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Gracias!`)
};

const fr_endorsement_request_draft_sentpre1 = /** @type {(inputs: Endorsement_Request_Draft_Sentpre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Merci !`)
};

const ar_endorsement_request_draft_sentpre1 = /** @type {(inputs: Endorsement_Request_Draft_Sentpre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شكرًا!`)
};

/**
* | output |
* | --- |
* | "Thanks!" |
*
* @param {Endorsement_Request_Draft_Sentpre1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_draft_sentpre1 = /** @type {((inputs?: Endorsement_Request_Draft_Sentpre1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Draft_Sentpre1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_draft_sentpre1(inputs)
	if (locale === "es") return es_endorsement_request_draft_sentpre1(inputs)
	if (locale === "fr") return fr_endorsement_request_draft_sentpre1(inputs)
	return ar_endorsement_request_draft_sentpre1(inputs)
});
export { endorsement_request_draft_sentpre1 as "endorsement.request.draft.sentPre" }