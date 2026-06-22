/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Form_Relationship_Selecttitle1Inputs */

const en_endorsement_form_relationship_selecttitle1 = /** @type {(inputs: Endorsement_Form_Relationship_Selecttitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Relationship`)
};

const es_endorsement_form_relationship_selecttitle1 = /** @type {(inputs: Endorsement_Form_Relationship_Selecttitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar relación`)
};

const fr_endorsement_form_relationship_selecttitle1 = /** @type {(inputs: Endorsement_Form_Relationship_Selecttitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner une relation`)
};

const ar_endorsement_form_relationship_selecttitle1 = /** @type {(inputs: Endorsement_Form_Relationship_Selecttitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر العلاقة`)
};

/**
* | output |
* | --- |
* | "Select Relationship" |
*
* @param {Endorsement_Form_Relationship_Selecttitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_relationship_selecttitle1 = /** @type {((inputs?: Endorsement_Form_Relationship_Selecttitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Form_Relationship_Selecttitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_form_relationship_selecttitle1(inputs)
	if (locale === "es") return es_endorsement_form_relationship_selecttitle1(inputs)
	if (locale === "fr") return fr_endorsement_form_relationship_selecttitle1(inputs)
	return ar_endorsement_form_relationship_selecttitle1(inputs)
});
export { endorsement_form_relationship_selecttitle1 as "endorsement.form.relationship.selectTitle" }