/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Draft_Sendingpre1Inputs */

const en_endorsement_request_draft_sendingpre1 = /** @type {(inputs: Endorsement_Request_Draft_Sendingpre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending`)
};

const es_endorsement_request_draft_sendingpre1 = /** @type {(inputs: Endorsement_Request_Draft_Sendingpre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviando`)
};

const fr_endorsement_request_draft_sendingpre1 = /** @type {(inputs: Endorsement_Request_Draft_Sendingpre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi de la`)
};

const ar_endorsement_request_draft_sendingpre1 = /** @type {(inputs: Endorsement_Request_Draft_Sendingpre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ إرسال`)
};

/**
* | output |
* | --- |
* | "Sending" |
*
* @param {Endorsement_Request_Draft_Sendingpre1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_draft_sendingpre1 = /** @type {((inputs?: Endorsement_Request_Draft_Sendingpre1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Draft_Sendingpre1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_draft_sendingpre1(inputs)
	if (locale === "es") return es_endorsement_request_draft_sendingpre1(inputs)
	if (locale === "fr") return fr_endorsement_request_draft_sendingpre1(inputs)
	return ar_endorsement_request_draft_sendingpre1(inputs)
});
export { endorsement_request_draft_sendingpre1 as "endorsement.request.draft.sendingPre" }