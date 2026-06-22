/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Options_Whattosay2Inputs */

const en_endorsement_request_options_whattosay2 = /** @type {(inputs: Endorsement_Request_Options_Whattosay2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What would you like to say?`)
};

const es_endorsement_request_options_whattosay2 = /** @type {(inputs: Endorsement_Request_Options_Whattosay2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Qué te gustaría decir?`)
};

const fr_endorsement_request_options_whattosay2 = /** @type {(inputs: Endorsement_Request_Options_Whattosay2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Que souhaitez-vous dire ?`)
};

const ar_endorsement_request_options_whattosay2 = /** @type {(inputs: Endorsement_Request_Options_Whattosay2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ماذا تريد أن تقول؟`)
};

/**
* | output |
* | --- |
* | "What would you like to say?" |
*
* @param {Endorsement_Request_Options_Whattosay2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_options_whattosay2 = /** @type {((inputs?: Endorsement_Request_Options_Whattosay2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Options_Whattosay2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_options_whattosay2(inputs)
	if (locale === "es") return es_endorsement_request_options_whattosay2(inputs)
	if (locale === "fr") return fr_endorsement_request_options_whattosay2(inputs)
	return ar_endorsement_request_options_whattosay2(inputs)
});
export { endorsement_request_options_whattosay2 as "endorsement.request.options.whatToSay" }