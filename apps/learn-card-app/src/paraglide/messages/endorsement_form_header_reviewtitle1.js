/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Form_Header_Reviewtitle1Inputs */

const en_endorsement_form_header_reviewtitle1 = /** @type {(inputs: Endorsement_Form_Header_Reviewtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Review Endorsement`)
};

const es_endorsement_form_header_reviewtitle1 = /** @type {(inputs: Endorsement_Form_Header_Reviewtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revisar aval`)
};

const fr_endorsement_form_header_reviewtitle1 = /** @type {(inputs: Endorsement_Form_Header_Reviewtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Examiner la recommandation`)
};

const ar_endorsement_form_header_reviewtitle1 = /** @type {(inputs: Endorsement_Form_Header_Reviewtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مراجعة التوصية`)
};

/**
* | output |
* | --- |
* | "Review Endorsement" |
*
* @param {Endorsement_Form_Header_Reviewtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_header_reviewtitle1 = /** @type {((inputs?: Endorsement_Form_Header_Reviewtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Form_Header_Reviewtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_form_header_reviewtitle1(inputs)
	if (locale === "es") return es_endorsement_form_header_reviewtitle1(inputs)
	if (locale === "fr") return fr_endorsement_form_header_reviewtitle1(inputs)
	return ar_endorsement_form_header_reviewtitle1(inputs)
});
export { endorsement_form_header_reviewtitle1 as "endorsement.form.header.reviewTitle" }