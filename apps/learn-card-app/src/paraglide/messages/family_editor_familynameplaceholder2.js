/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Editor_Familynameplaceholder2Inputs */

const en_family_editor_familynameplaceholder2 = /** @type {(inputs: Family_Editor_Familynameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Family Name`)
};

const es_family_editor_familynameplaceholder2 = /** @type {(inputs: Family_Editor_Familynameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de la familia`)
};

const fr_family_editor_familynameplaceholder2 = /** @type {(inputs: Family_Editor_Familynameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom de la famille`)
};

const ar_family_editor_familynameplaceholder2 = /** @type {(inputs: Family_Editor_Familynameplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم العائلة`)
};

/**
* | output |
* | --- |
* | "Family Name" |
*
* @param {Family_Editor_Familynameplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_editor_familynameplaceholder2 = /** @type {((inputs?: Family_Editor_Familynameplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Editor_Familynameplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_editor_familynameplaceholder2(inputs)
	if (locale === "es") return es_family_editor_familynameplaceholder2(inputs)
	if (locale === "fr") return fr_family_editor_familynameplaceholder2(inputs)
	return ar_family_editor_familynameplaceholder2(inputs)
});
export { family_editor_familynameplaceholder2 as "family.editor.familyNamePlaceholder" }