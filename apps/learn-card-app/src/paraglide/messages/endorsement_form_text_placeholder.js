/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Form_Text_PlaceholderInputs */

const en_endorsement_form_text_placeholder = /** @type {(inputs: Endorsement_Form_Text_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Write endorsement...`)
};

const es_endorsement_form_text_placeholder = /** @type {(inputs: Endorsement_Form_Text_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escribe un aval...`)
};

const fr_endorsement_form_text_placeholder = /** @type {(inputs: Endorsement_Form_Text_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rédiger une recommandation...`)
};

const ar_endorsement_form_text_placeholder = /** @type {(inputs: Endorsement_Form_Text_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اكتب توصية...`)
};

/**
* | output |
* | --- |
* | "Write endorsement..." |
*
* @param {Endorsement_Form_Text_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_form_text_placeholder = /** @type {((inputs?: Endorsement_Form_Text_PlaceholderInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Form_Text_PlaceholderInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_form_text_placeholder(inputs)
	if (locale === "es") return es_endorsement_form_text_placeholder(inputs)
	if (locale === "fr") return fr_endorsement_form_text_placeholder(inputs)
	return ar_endorsement_form_text_placeholder(inputs)
});
export { endorsement_form_text_placeholder as "endorsement.form.text.placeholder" }