/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Options_Howtosend2Inputs */

const en_endorsement_request_options_howtosend2 = /** @type {(inputs: Endorsement_Request_Options_Howtosend2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How do you want to send it?`)
};

const es_endorsement_request_options_howtosend2 = /** @type {(inputs: Endorsement_Request_Options_Howtosend2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Cómo quieres enviarlo?`)
};

const fr_endorsement_request_options_howtosend2 = /** @type {(inputs: Endorsement_Request_Options_Howtosend2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comment souhaitez-vous l'envoyer ?`)
};

const ar_endorsement_request_options_howtosend2 = /** @type {(inputs: Endorsement_Request_Options_Howtosend2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كيف تريد إرسالها؟`)
};

/**
* | output |
* | --- |
* | "How do you want to send it?" |
*
* @param {Endorsement_Request_Options_Howtosend2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_options_howtosend2 = /** @type {((inputs?: Endorsement_Request_Options_Howtosend2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Options_Howtosend2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_options_howtosend2(inputs)
	if (locale === "es") return es_endorsement_request_options_howtosend2(inputs)
	if (locale === "fr") return fr_endorsement_request_options_howtosend2(inputs)
	return ar_endorsement_request_options_howtosend2(inputs)
});
export { endorsement_request_options_howtosend2 as "endorsement.request.options.howToSend" }