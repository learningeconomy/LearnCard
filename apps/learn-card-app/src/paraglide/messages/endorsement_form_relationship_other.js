/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Form_Relationship_OtherInputs */

const en_endorsement_form_relationship_other = /** @type {(inputs: Endorsement_Form_Relationship_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Other`)
};

const es_endorsement_form_relationship_other = /** @type {(inputs: Endorsement_Form_Relationship_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Otro`)
};

const fr_endorsement_form_relationship_other = /** @type {(inputs: Endorsement_Form_Relationship_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autre`)
};

const ar_endorsement_form_relationship_other = /** @type {(inputs: Endorsement_Form_Relationship_OtherInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أخرى`)
};

/**
* | output |
* | --- |
* | "Other" |
*
* @param {Endorsement_Form_Relationship_OtherInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_relationship_other = /** @type {((inputs?: Endorsement_Form_Relationship_OtherInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Form_Relationship_OtherInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_form_relationship_other(inputs)
	if (locale === "es") return es_endorsement_form_relationship_other(inputs)
	if (locale === "fr") return fr_endorsement_form_relationship_other(inputs)
	return ar_endorsement_form_relationship_other(inputs)
});
export { endorsement_form_relationship_other as "endorsement.form.relationship.other" }