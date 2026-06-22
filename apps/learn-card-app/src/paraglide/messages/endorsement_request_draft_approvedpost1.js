/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Draft_Approvedpost1Inputs */

const en_endorsement_request_draft_approvedpost1 = /** @type {(inputs: Endorsement_Request_Draft_Approvedpost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Endorsement Approved!`)
};

const es_endorsement_request_draft_approvedpost1 = /** @type {(inputs: Endorsement_Request_Draft_Approvedpost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Aval aprobado!`)
};

const fr_endorsement_request_draft_approvedpost1 = /** @type {(inputs: Endorsement_Request_Draft_Approvedpost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommandation approuvée !`)
};

const ar_endorsement_request_draft_approvedpost1 = /** @type {(inputs: Endorsement_Request_Draft_Approvedpost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت الموافقة على التوصية!`)
};

/**
* | output |
* | --- |
* | "Endorsement Approved!" |
*
* @param {Endorsement_Request_Draft_Approvedpost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_draft_approvedpost1 = /** @type {((inputs?: Endorsement_Request_Draft_Approvedpost1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Draft_Approvedpost1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_draft_approvedpost1(inputs)
	if (locale === "es") return es_endorsement_request_draft_approvedpost1(inputs)
	if (locale === "fr") return fr_endorsement_request_draft_approvedpost1(inputs)
	return ar_endorsement_request_draft_approvedpost1(inputs)
});
export { endorsement_request_draft_approvedpost1 as "endorsement.request.draft.approvedPost" }