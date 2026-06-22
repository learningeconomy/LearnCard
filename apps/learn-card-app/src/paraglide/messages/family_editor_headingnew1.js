/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Editor_Headingnew1Inputs */

const en_family_editor_headingnew1 = /** @type {(inputs: Family_Editor_Headingnew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Family`)
};

const es_family_editor_headingnew1 = /** @type {(inputs: Family_Editor_Headingnew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva familia`)
};

const fr_family_editor_headingnew1 = /** @type {(inputs: Family_Editor_Headingnew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle famille`)
};

const ar_family_editor_headingnew1 = /** @type {(inputs: Family_Editor_Headingnew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عائلة جديدة`)
};

/**
* | output |
* | --- |
* | "New Family" |
*
* @param {Family_Editor_Headingnew1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_editor_headingnew1 = /** @type {((inputs?: Family_Editor_Headingnew1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Editor_Headingnew1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_editor_headingnew1(inputs)
	if (locale === "es") return es_family_editor_headingnew1(inputs)
	if (locale === "fr") return fr_family_editor_headingnew1(inputs)
	return ar_family_editor_headingnew1(inputs)
});
export { family_editor_headingnew1 as "family.editor.headingNew" }