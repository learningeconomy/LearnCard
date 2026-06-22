/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Endorsement_Request_Draft_Waitingreview1Inputs */

const en_endorsement_request_draft_waitingreview1 = /** @type {(inputs: Endorsement_Request_Draft_Waitingreview1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Waiting for review by ${i?.name}`)
};

const es_endorsement_request_draft_waitingreview1 = /** @type {(inputs: Endorsement_Request_Draft_Waitingreview1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Esperando revisión de ${i?.name}`)
};

const fr_endorsement_request_draft_waitingreview1 = /** @type {(inputs: Endorsement_Request_Draft_Waitingreview1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`En attente d'examen par ${i?.name}`)
};

const ar_endorsement_request_draft_waitingreview1 = /** @type {(inputs: Endorsement_Request_Draft_Waitingreview1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`في انتظار المراجعة من ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Waiting for review by {name}" |
*
* @param {Endorsement_Request_Draft_Waitingreview1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_draft_waitingreview1 = /** @type {((inputs: Endorsement_Request_Draft_Waitingreview1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Draft_Waitingreview1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_draft_waitingreview1(inputs)
	if (locale === "es") return es_endorsement_request_draft_waitingreview1(inputs)
	if (locale === "fr") return fr_endorsement_request_draft_waitingreview1(inputs)
	return ar_endorsement_request_draft_waitingreview1(inputs)
});
export { endorsement_request_draft_waitingreview1 as "endorsement.request.draft.waitingReview" }