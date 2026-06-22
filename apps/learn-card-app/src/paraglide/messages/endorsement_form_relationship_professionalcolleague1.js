/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Form_Relationship_Professionalcolleague1Inputs */

const en_endorsement_form_relationship_professionalcolleague1 = /** @type {(inputs: Endorsement_Form_Relationship_Professionalcolleague1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Professional Colleague`)
};

const es_endorsement_form_relationship_professionalcolleague1 = /** @type {(inputs: Endorsement_Form_Relationship_Professionalcolleague1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compañero profesional`)
};

const fr_endorsement_form_relationship_professionalcolleague1 = /** @type {(inputs: Endorsement_Form_Relationship_Professionalcolleague1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collègue professionnel`)
};

const ar_endorsement_form_relationship_professionalcolleague1 = /** @type {(inputs: Endorsement_Form_Relationship_Professionalcolleague1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`زميل مهني`)
};

/**
* | output |
* | --- |
* | "Professional Colleague" |
*
* @param {Endorsement_Form_Relationship_Professionalcolleague1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_relationship_professionalcolleague1 = /** @type {((inputs?: Endorsement_Form_Relationship_Professionalcolleague1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Form_Relationship_Professionalcolleague1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_form_relationship_professionalcolleague1(inputs)
	if (locale === "es") return es_endorsement_form_relationship_professionalcolleague1(inputs)
	if (locale === "fr") return fr_endorsement_form_relationship_professionalcolleague1(inputs)
	return ar_endorsement_form_relationship_professionalcolleague1(inputs)
});
export { endorsement_form_relationship_professionalcolleague1 as "endorsement.form.relationship.professionalColleague" }