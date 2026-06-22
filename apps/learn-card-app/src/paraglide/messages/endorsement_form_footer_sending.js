/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Form_Footer_SendingInputs */

const en_endorsement_form_footer_sending = /** @type {(inputs: Endorsement_Form_Footer_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending...`)
};

const es_endorsement_form_footer_sending = /** @type {(inputs: Endorsement_Form_Footer_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviando...`)
};

const fr_endorsement_form_footer_sending = /** @type {(inputs: Endorsement_Form_Footer_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi...`)
};

const ar_endorsement_form_footer_sending = /** @type {(inputs: Endorsement_Form_Footer_SendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الإرسال...`)
};

/**
* | output |
* | --- |
* | "Sending..." |
*
* @param {Endorsement_Form_Footer_SendingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_footer_sending = /** @type {((inputs?: Endorsement_Form_Footer_SendingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Form_Footer_SendingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_form_footer_sending(inputs)
	if (locale === "es") return es_endorsement_form_footer_sending(inputs)
	if (locale === "fr") return fr_endorsement_form_footer_sending(inputs)
	return ar_endorsement_form_footer_sending(inputs)
});
export { endorsement_form_footer_sending as "endorsement.form.footer.sending" }