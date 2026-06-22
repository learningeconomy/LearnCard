/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Options_Emailplaceholder1Inputs */

const en_endorsement_request_options_emailplaceholder1 = /** @type {(inputs: Endorsement_Request_Options_Emailplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email`)
};

const es_endorsement_request_options_emailplaceholder1 = /** @type {(inputs: Endorsement_Request_Options_Emailplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Correo`)
};

const fr_endorsement_request_options_emailplaceholder1 = /** @type {(inputs: Endorsement_Request_Options_Emailplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail`)
};

const ar_endorsement_request_options_emailplaceholder1 = /** @type {(inputs: Endorsement_Request_Options_Emailplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البريد الإلكتروني`)
};

/**
* | output |
* | --- |
* | "Email" |
*
* @param {Endorsement_Request_Options_Emailplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_options_emailplaceholder1 = /** @type {((inputs?: Endorsement_Request_Options_Emailplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Options_Emailplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_options_emailplaceholder1(inputs)
	if (locale === "es") return es_endorsement_request_options_emailplaceholder1(inputs)
	if (locale === "fr") return fr_endorsement_request_options_emailplaceholder1(inputs)
	return ar_endorsement_request_options_emailplaceholder1(inputs)
});
export { endorsement_request_options_emailplaceholder1 as "endorsement.request.options.emailPlaceholder" }