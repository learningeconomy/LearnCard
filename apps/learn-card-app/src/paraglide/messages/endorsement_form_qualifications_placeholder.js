/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Form_Qualifications_PlaceholderInputs */

const en_endorsement_form_qualifications_placeholder = /** @type {(inputs: Endorsement_Form_Qualifications_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My qualifications include...`)
};

const es_endorsement_form_qualifications_placeholder = /** @type {(inputs: Endorsement_Form_Qualifications_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mis cualificaciones incluyen...`)
};

const fr_endorsement_form_qualifications_placeholder = /** @type {(inputs: Endorsement_Form_Qualifications_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mes qualifications incluent...`)
};

const ar_endorsement_form_qualifications_placeholder = /** @type {(inputs: Endorsement_Form_Qualifications_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تشمل مؤهلاتي...`)
};

/**
* | output |
* | --- |
* | "My qualifications include..." |
*
* @param {Endorsement_Form_Qualifications_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_qualifications_placeholder = /** @type {((inputs?: Endorsement_Form_Qualifications_PlaceholderInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Form_Qualifications_PlaceholderInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_form_qualifications_placeholder(inputs)
	if (locale === "es") return es_endorsement_form_qualifications_placeholder(inputs)
	if (locale === "fr") return fr_endorsement_form_qualifications_placeholder(inputs)
	return ar_endorsement_form_qualifications_placeholder(inputs)
});
export { endorsement_form_qualifications_placeholder as "endorsement.form.qualifications.placeholder" }