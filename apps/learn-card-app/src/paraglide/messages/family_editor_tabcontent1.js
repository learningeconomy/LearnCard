/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Editor_Tabcontent1Inputs */

const en_family_editor_tabcontent1 = /** @type {(inputs: Family_Editor_Tabcontent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Content`)
};

const es_family_editor_tabcontent1 = /** @type {(inputs: Family_Editor_Tabcontent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contenido`)
};

const fr_family_editor_tabcontent1 = /** @type {(inputs: Family_Editor_Tabcontent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contenu`)
};

const ar_family_editor_tabcontent1 = /** @type {(inputs: Family_Editor_Tabcontent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المحتوى`)
};

/**
* | output |
* | --- |
* | "Content" |
*
* @param {Family_Editor_Tabcontent1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_editor_tabcontent1 = /** @type {((inputs?: Family_Editor_Tabcontent1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Editor_Tabcontent1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_editor_tabcontent1(inputs)
	if (locale === "es") return es_family_editor_tabcontent1(inputs)
	if (locale === "fr") return fr_family_editor_tabcontent1(inputs)
	return ar_family_editor_tabcontent1(inputs)
});
export { family_editor_tabcontent1 as "family.editor.tabContent" }