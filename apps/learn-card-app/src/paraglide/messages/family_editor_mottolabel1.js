/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Editor_Mottolabel1Inputs */

const en_family_editor_mottolabel1 = /** @type {(inputs: Family_Editor_Mottolabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Family Motto`)
};

const es_family_editor_mottolabel1 = /** @type {(inputs: Family_Editor_Mottolabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lema de la familia`)
};

const fr_family_editor_mottolabel1 = /** @type {(inputs: Family_Editor_Mottolabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Devise de la famille`)
};

const ar_family_editor_mottolabel1 = /** @type {(inputs: Family_Editor_Mottolabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شعار العائلة`)
};

/**
* | output |
* | --- |
* | "Family Motto" |
*
* @param {Family_Editor_Mottolabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_editor_mottolabel1 = /** @type {((inputs?: Family_Editor_Mottolabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Editor_Mottolabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_editor_mottolabel1(inputs)
	if (locale === "es") return es_family_editor_mottolabel1(inputs)
	if (locale === "fr") return fr_family_editor_mottolabel1(inputs)
	return ar_family_editor_mottolabel1(inputs)
});
export { family_editor_mottolabel1 as "family.editor.mottoLabel" }