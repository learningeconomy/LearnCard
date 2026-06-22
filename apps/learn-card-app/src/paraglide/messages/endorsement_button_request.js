/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Button_RequestInputs */

const en_endorsement_button_request = /** @type {(inputs: Endorsement_Button_RequestInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Endorsement`)
};

const es_endorsement_button_request = /** @type {(inputs: Endorsement_Button_RequestInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar aval`)
};

const fr_endorsement_button_request = /** @type {(inputs: Endorsement_Button_RequestInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander une recommandation`)
};

const ar_endorsement_button_request = /** @type {(inputs: Endorsement_Button_RequestInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب توصية`)
};

/**
* | output |
* | --- |
* | "Request Endorsement" |
*
* @param {Endorsement_Button_RequestInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_button_request = /** @type {((inputs?: Endorsement_Button_RequestInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Button_RequestInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_button_request(inputs)
	if (locale === "es") return es_endorsement_button_request(inputs)
	if (locale === "fr") return fr_endorsement_button_request(inputs)
	return ar_endorsement_button_request(inputs)
});
export { endorsement_button_request as "endorsement.button.request" }