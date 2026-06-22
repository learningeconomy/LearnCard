/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Form_Relationship_LabelInputs */

const en_endorsement_form_relationship_label = /** @type {(inputs: Endorsement_Form_Relationship_LabelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Relationship`)
};

const es_endorsement_form_relationship_label = /** @type {(inputs: Endorsement_Form_Relationship_LabelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Relación`)
};

const fr_endorsement_form_relationship_label = /** @type {(inputs: Endorsement_Form_Relationship_LabelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Relation`)
};

const ar_endorsement_form_relationship_label = /** @type {(inputs: Endorsement_Form_Relationship_LabelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العلاقة`)
};

/**
* | output |
* | --- |
* | "Relationship" |
*
* @param {Endorsement_Form_Relationship_LabelInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_relationship_label = /** @type {((inputs?: Endorsement_Form_Relationship_LabelInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Form_Relationship_LabelInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_form_relationship_label(inputs)
	if (locale === "es") return es_endorsement_form_relationship_label(inputs)
	if (locale === "fr") return fr_endorsement_form_relationship_label(inputs)
	return ar_endorsement_form_relationship_label(inputs)
});
export { endorsement_form_relationship_label as "endorsement.form.relationship.label" }