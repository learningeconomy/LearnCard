/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Endorsement_Form_Relationship_PromptInputs */

const en_endorsement_form_relationship_prompt = /** @type {(inputs: Endorsement_Form_Relationship_PromptInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`How do you know ${i?.name}?`)
};

const es_endorsement_form_relationship_prompt = /** @type {(inputs: Endorsement_Form_Relationship_PromptInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¿Cómo conoces a ${i?.name}?`)
};

const fr_endorsement_form_relationship_prompt = /** @type {(inputs: Endorsement_Form_Relationship_PromptInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Comment connaissez-vous ${i?.name} ?`)
};

const ar_endorsement_form_relationship_prompt = /** @type {(inputs: Endorsement_Form_Relationship_PromptInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`كيف تعرف ${i?.name}؟`)
};

/**
* | output |
* | --- |
* | "How do you know {name}?" |
*
* @param {Endorsement_Form_Relationship_PromptInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_relationship_prompt = /** @type {((inputs: Endorsement_Form_Relationship_PromptInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Form_Relationship_PromptInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_form_relationship_prompt(inputs)
	if (locale === "es") return es_endorsement_form_relationship_prompt(inputs)
	if (locale === "fr") return fr_endorsement_form_relationship_prompt(inputs)
	return ar_endorsement_form_relationship_prompt(inputs)
});
export { endorsement_form_relationship_prompt as "endorsement.form.relationship.prompt" }