/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Options_GeneratingInputs */

const en_endorsement_request_options_generating = /** @type {(inputs: Endorsement_Request_Options_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating...`)
};

const es_endorsement_request_options_generating = /** @type {(inputs: Endorsement_Request_Options_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generando...`)
};

const fr_endorsement_request_options_generating = /** @type {(inputs: Endorsement_Request_Options_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération...`)
};

const ar_endorsement_request_options_generating = /** @type {(inputs: Endorsement_Request_Options_GeneratingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الإنشاء...`)
};

/**
* | output |
* | --- |
* | "Generating..." |
*
* @param {Endorsement_Request_Options_GeneratingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_options_generating = /** @type {((inputs?: Endorsement_Request_Options_GeneratingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Options_GeneratingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_options_generating(inputs)
	if (locale === "es") return es_endorsement_request_options_generating(inputs)
	if (locale === "fr") return fr_endorsement_request_options_generating(inputs)
	return ar_endorsement_request_options_generating(inputs)
});
export { endorsement_request_options_generating as "endorsement.request.options.generating" }