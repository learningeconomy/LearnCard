/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Form_Relationship_CollegeInputs */

const en_endorsement_form_relationship_college = /** @type {(inputs: Endorsement_Form_Relationship_CollegeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`College`)
};

const es_endorsement_form_relationship_college = /** @type {(inputs: Endorsement_Form_Relationship_CollegeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compañero de estudios`)
};

const fr_endorsement_form_relationship_college = /** @type {(inputs: Endorsement_Form_Relationship_CollegeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Camarade d'études`)
};

const ar_endorsement_form_relationship_college = /** @type {(inputs: Endorsement_Form_Relationship_CollegeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`زميل دراسة`)
};

/**
* | output |
* | --- |
* | "College" |
*
* @param {Endorsement_Form_Relationship_CollegeInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_relationship_college = /** @type {((inputs?: Endorsement_Form_Relationship_CollegeInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Form_Relationship_CollegeInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_form_relationship_college(inputs)
	if (locale === "es") return es_endorsement_form_relationship_college(inputs)
	if (locale === "fr") return fr_endorsement_form_relationship_college(inputs)
	return ar_endorsement_form_relationship_college(inputs)
});
export { endorsement_form_relationship_college as "endorsement.form.relationship.college" }