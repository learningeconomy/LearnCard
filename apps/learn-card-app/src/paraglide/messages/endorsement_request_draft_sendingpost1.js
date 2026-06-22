/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Draft_Sendingpost1Inputs */

const en_endorsement_request_draft_sendingpost1 = /** @type {(inputs: Endorsement_Request_Draft_Sendingpost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Endorsement...`)
};

const es_endorsement_request_draft_sendingpost1 = /** @type {(inputs: Endorsement_Request_Draft_Sendingpost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`aval...`)
};

const fr_endorsement_request_draft_sendingpost1 = /** @type {(inputs: Endorsement_Request_Draft_Sendingpost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`recommandation...`)
};

const ar_endorsement_request_draft_sendingpost1 = /** @type {(inputs: Endorsement_Request_Draft_Sendingpost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التوصية...`)
};

/**
* | output |
* | --- |
* | "Endorsement..." |
*
* @param {Endorsement_Request_Draft_Sendingpost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_draft_sendingpost1 = /** @type {((inputs?: Endorsement_Request_Draft_Sendingpost1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Draft_Sendingpost1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_draft_sendingpost1(inputs)
	if (locale === "es") return es_endorsement_request_draft_sendingpost1(inputs)
	if (locale === "fr") return fr_endorsement_request_draft_sendingpost1(inputs)
	return ar_endorsement_request_draft_sendingpost1(inputs)
});
export { endorsement_request_draft_sendingpost1 as "endorsement.request.draft.sendingPost" }