/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Form_Footer_DeclineInputs */

const en_endorsement_form_footer_decline = /** @type {(inputs: Endorsement_Form_Footer_DeclineInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Decline`)
};

const es_endorsement_form_footer_decline = /** @type {(inputs: Endorsement_Form_Footer_DeclineInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechazar`)
};

const fr_endorsement_form_footer_decline = /** @type {(inputs: Endorsement_Form_Footer_DeclineInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refuser`)
};

const ar_endorsement_form_footer_decline = /** @type {(inputs: Endorsement_Form_Footer_DeclineInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفض`)
};

/**
* | output |
* | --- |
* | "Decline" |
*
* @param {Endorsement_Form_Footer_DeclineInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_footer_decline = /** @type {((inputs?: Endorsement_Form_Footer_DeclineInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Form_Footer_DeclineInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_form_footer_decline(inputs)
	if (locale === "es") return es_endorsement_form_footer_decline(inputs)
	if (locale === "fr") return fr_endorsement_form_footer_decline(inputs)
	return ar_endorsement_form_footer_decline(inputs)
});
export { endorsement_form_footer_decline as "endorsement.form.footer.decline" }