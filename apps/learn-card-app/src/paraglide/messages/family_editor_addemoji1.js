/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Editor_Addemoji1Inputs */

const en_family_editor_addemoji1 = /** @type {(inputs: Family_Editor_Addemoji1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a Family Emoji`)
};

const es_family_editor_addemoji1 = /** @type {(inputs: Family_Editor_Addemoji1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir un emoji de familia`)
};

const fr_family_editor_addemoji1 = /** @type {(inputs: Family_Editor_Addemoji1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un emoji de famille`)
};

const ar_family_editor_addemoji1 = /** @type {(inputs: Family_Editor_Addemoji1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة رمز تعبيري للعائلة`)
};

/**
* | output |
* | --- |
* | "Add a Family Emoji" |
*
* @param {Family_Editor_Addemoji1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_editor_addemoji1 = /** @type {((inputs?: Family_Editor_Addemoji1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Editor_Addemoji1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_editor_addemoji1(inputs)
	if (locale === "es") return es_family_editor_addemoji1(inputs)
	if (locale === "fr") return fr_family_editor_addemoji1(inputs)
	return ar_family_editor_addemoji1(inputs)
});
export { family_editor_addemoji1 as "family.editor.addEmoji" }