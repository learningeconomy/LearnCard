/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Options_Getcode1Inputs */

const en_endorsement_request_options_getcode1 = /** @type {(inputs: Endorsement_Request_Options_Getcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get Code`)
};

const es_endorsement_request_options_getcode1 = /** @type {(inputs: Endorsement_Request_Options_Getcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener código`)
};

const fr_endorsement_request_options_getcode1 = /** @type {(inputs: Endorsement_Request_Options_Getcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir le code`)
};

const ar_endorsement_request_options_getcode1 = /** @type {(inputs: Endorsement_Request_Options_Getcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحصول على الرمز`)
};

/**
* | output |
* | --- |
* | "Get Code" |
*
* @param {Endorsement_Request_Options_Getcode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_options_getcode1 = /** @type {((inputs?: Endorsement_Request_Options_Getcode1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Options_Getcode1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_options_getcode1(inputs)
	if (locale === "es") return es_endorsement_request_options_getcode1(inputs)
	if (locale === "fr") return fr_endorsement_request_options_getcode1(inputs)
	return ar_endorsement_request_options_getcode1(inputs)
});
export { endorsement_request_options_getcode1 as "endorsement.request.options.getCode" }