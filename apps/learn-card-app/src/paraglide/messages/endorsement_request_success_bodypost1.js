/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Success_Bodypost1Inputs */

const en_endorsement_request_success_bodypost1 = /** @type {(inputs: Endorsement_Request_Success_Bodypost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`endorsement is ready.`)
};

const es_endorsement_request_success_bodypost1 = /** @type {(inputs: Endorsement_Request_Success_Bodypost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`aval esté listo.`)
};

const fr_endorsement_request_success_bodypost1 = /** @type {(inputs: Endorsement_Request_Success_Bodypost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`recommandation sera prête.`)
};

const ar_endorsement_request_success_bodypost1 = /** @type {(inputs: Endorsement_Request_Success_Bodypost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التوصية جاهزة.`)
};

/**
* | output |
* | --- |
* | "endorsement is ready." |
*
* @param {Endorsement_Request_Success_Bodypost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_success_bodypost1 = /** @type {((inputs?: Endorsement_Request_Success_Bodypost1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Success_Bodypost1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_success_bodypost1(inputs)
	if (locale === "es") return es_endorsement_request_success_bodypost1(inputs)
	if (locale === "fr") return fr_endorsement_request_success_bodypost1(inputs)
	return ar_endorsement_request_success_bodypost1(inputs)
});
export { endorsement_request_success_bodypost1 as "endorsement.request.success.bodyPost" }