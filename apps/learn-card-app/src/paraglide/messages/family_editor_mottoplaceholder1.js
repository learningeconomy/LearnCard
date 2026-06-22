/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Editor_Mottoplaceholder1Inputs */

const en_family_editor_mottoplaceholder1 = /** @type {(inputs: Family_Editor_Mottoplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`About my family...`)
};

const es_family_editor_mottoplaceholder1 = /** @type {(inputs: Family_Editor_Mottoplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sobre mi familia...`)
};

const fr_family_editor_mottoplaceholder1 = /** @type {(inputs: Family_Editor_Mottoplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`À propos de ma famille...`)
};

const ar_family_editor_mottoplaceholder1 = /** @type {(inputs: Family_Editor_Mottoplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عن عائلتي...`)
};

/**
* | output |
* | --- |
* | "About my family..." |
*
* @param {Family_Editor_Mottoplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_editor_mottoplaceholder1 = /** @type {((inputs?: Family_Editor_Mottoplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Editor_Mottoplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_editor_mottoplaceholder1(inputs)
	if (locale === "es") return es_family_editor_mottoplaceholder1(inputs)
	if (locale === "fr") return fr_family_editor_mottoplaceholder1(inputs)
	return ar_family_editor_mottoplaceholder1(inputs)
});
export { family_editor_mottoplaceholder1 as "family.editor.mottoPlaceholder" }