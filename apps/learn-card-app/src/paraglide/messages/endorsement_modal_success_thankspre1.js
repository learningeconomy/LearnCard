/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Modal_Success_Thankspre1Inputs */

const en_endorsement_modal_success_thankspre1 = /** @type {(inputs: Endorsement_Modal_Success_Thankspre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Thanks!`)
};

const es_endorsement_modal_success_thankspre1 = /** @type {(inputs: Endorsement_Modal_Success_Thankspre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Gracias!`)
};

const fr_endorsement_modal_success_thankspre1 = /** @type {(inputs: Endorsement_Modal_Success_Thankspre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Merci !`)
};

const ar_endorsement_modal_success_thankspre1 = /** @type {(inputs: Endorsement_Modal_Success_Thankspre1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شكرًا!`)
};

/**
* | output |
* | --- |
* | "Thanks!" |
*
* @param {Endorsement_Modal_Success_Thankspre1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_modal_success_thankspre1 = /** @type {((inputs?: Endorsement_Modal_Success_Thankspre1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Modal_Success_Thankspre1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_modal_success_thankspre1(inputs)
	if (locale === "es") return es_endorsement_modal_success_thankspre1(inputs)
	if (locale === "fr") return fr_endorsement_modal_success_thankspre1(inputs)
	return ar_endorsement_modal_success_thankspre1(inputs)
});
export { endorsement_modal_success_thankspre1 as "endorsement.modal.success.thanksPre" }