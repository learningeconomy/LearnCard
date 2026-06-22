/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Success_Bodypre1Inputs */

const en_endorsement_request_success_bodypre1 = /** @type {(inputs: Endorsement_Request_Success_Bodypre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You’ll be notified when the`)
};

const es_endorsement_request_success_bodypre1 = /** @type {(inputs: Endorsement_Request_Success_Bodypre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Te avisaremos cuando el`)
};

const fr_endorsement_request_success_bodypre1 = /** @type {(inputs: Endorsement_Request_Success_Bodypre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous serez averti lorsque la`)
};

const ar_endorsement_request_success_bodypre1 = /** @type {(inputs: Endorsement_Request_Success_Bodypre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيتم إخطارك عندما تصبح`)
};

/**
* | output |
* | --- |
* | "You’ll be notified when the" |
*
* @param {Endorsement_Request_Success_Bodypre1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_success_bodypre1 = /** @type {((inputs?: Endorsement_Request_Success_Bodypre1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Success_Bodypre1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_success_bodypre1(inputs)
	if (locale === "es") return es_endorsement_request_success_bodypre1(inputs)
	if (locale === "fr") return fr_endorsement_request_success_bodypre1(inputs)
	return ar_endorsement_request_success_bodypre1(inputs)
});
export { endorsement_request_success_bodypre1 as "endorsement.request.success.bodyPre" }