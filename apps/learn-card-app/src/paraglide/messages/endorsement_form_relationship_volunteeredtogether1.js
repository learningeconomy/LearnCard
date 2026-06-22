/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Form_Relationship_Volunteeredtogether1Inputs */

const en_endorsement_form_relationship_volunteeredtogether1 = /** @type {(inputs: Endorsement_Form_Relationship_Volunteeredtogether1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volunteered Together`)
};

const es_endorsement_form_relationship_volunteeredtogether1 = /** @type {(inputs: Endorsement_Form_Relationship_Volunteeredtogether1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voluntariado juntos`)
};

const fr_endorsement_form_relationship_volunteeredtogether1 = /** @type {(inputs: Endorsement_Form_Relationship_Volunteeredtogether1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bénévolat ensemble`)
};

const ar_endorsement_form_relationship_volunteeredtogether1 = /** @type {(inputs: Endorsement_Form_Relationship_Volunteeredtogether1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطوعنا معًا`)
};

/**
* | output |
* | --- |
* | "Volunteered Together" |
*
* @param {Endorsement_Form_Relationship_Volunteeredtogether1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_relationship_volunteeredtogether1 = /** @type {((inputs?: Endorsement_Form_Relationship_Volunteeredtogether1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Form_Relationship_Volunteeredtogether1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_form_relationship_volunteeredtogether1(inputs)
	if (locale === "es") return es_endorsement_form_relationship_volunteeredtogether1(inputs)
	if (locale === "fr") return fr_endorsement_form_relationship_volunteeredtogether1(inputs)
	return ar_endorsement_form_relationship_volunteeredtogether1(inputs)
});
export { endorsement_form_relationship_volunteeredtogether1 as "endorsement.form.relationship.volunteeredTogether" }