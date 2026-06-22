/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Form_Relationship_Otherplaceholder1Inputs */

const en_endorsement_form_relationship_otherplaceholder1 = /** @type {(inputs: Endorsement_Form_Relationship_Otherplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Other...`)
};

const es_endorsement_form_relationship_otherplaceholder1 = /** @type {(inputs: Endorsement_Form_Relationship_Otherplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Otro...`)
};

const fr_endorsement_form_relationship_otherplaceholder1 = /** @type {(inputs: Endorsement_Form_Relationship_Otherplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autre...`)
};

const ar_endorsement_form_relationship_otherplaceholder1 = /** @type {(inputs: Endorsement_Form_Relationship_Otherplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أخرى...`)
};

/**
* | output |
* | --- |
* | "Other..." |
*
* @param {Endorsement_Form_Relationship_Otherplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_relationship_otherplaceholder1 = /** @type {((inputs?: Endorsement_Form_Relationship_Otherplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Form_Relationship_Otherplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_form_relationship_otherplaceholder1(inputs)
	if (locale === "es") return es_endorsement_form_relationship_otherplaceholder1(inputs)
	if (locale === "fr") return fr_endorsement_form_relationship_otherplaceholder1(inputs)
	return ar_endorsement_form_relationship_otherplaceholder1(inputs)
});
export { endorsement_form_relationship_otherplaceholder1 as "endorsement.form.relationship.otherPlaceholder" }