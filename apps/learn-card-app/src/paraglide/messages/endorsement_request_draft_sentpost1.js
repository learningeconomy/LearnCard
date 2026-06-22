/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Draft_Sentpost1Inputs */

const en_endorsement_request_draft_sentpost1 = /** @type {(inputs: Endorsement_Request_Draft_Sentpost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Endorsement Sent!`)
};

const es_endorsement_request_draft_sentpost1 = /** @type {(inputs: Endorsement_Request_Draft_Sentpost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Aval enviado!`)
};

const fr_endorsement_request_draft_sentpost1 = /** @type {(inputs: Endorsement_Request_Draft_Sentpost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommandation envoyée !`)
};

const ar_endorsement_request_draft_sentpost1 = /** @type {(inputs: Endorsement_Request_Draft_Sentpost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال التوصية!`)
};

/**
* | output |
* | --- |
* | "Endorsement Sent!" |
*
* @param {Endorsement_Request_Draft_Sentpost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_draft_sentpost1 = /** @type {((inputs?: Endorsement_Request_Draft_Sentpost1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Draft_Sentpost1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_draft_sentpost1(inputs)
	if (locale === "es") return es_endorsement_request_draft_sentpost1(inputs)
	if (locale === "fr") return fr_endorsement_request_draft_sentpost1(inputs)
	return ar_endorsement_request_draft_sentpost1(inputs)
});
export { endorsement_request_draft_sentpost1 as "endorsement.request.draft.sentPost" }