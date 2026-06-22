/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Editor_Familynamelabel2Inputs */

const en_family_editor_familynamelabel2 = /** @type {(inputs: Family_Editor_Familynamelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Family name`)
};

const es_family_editor_familynamelabel2 = /** @type {(inputs: Family_Editor_Familynamelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de la familia`)
};

const fr_family_editor_familynamelabel2 = /** @type {(inputs: Family_Editor_Familynamelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom de la famille`)
};

const ar_family_editor_familynamelabel2 = /** @type {(inputs: Family_Editor_Familynamelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم العائلة`)
};

/**
* | output |
* | --- |
* | "Family name" |
*
* @param {Family_Editor_Familynamelabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_editor_familynamelabel2 = /** @type {((inputs?: Family_Editor_Familynamelabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Editor_Familynamelabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_editor_familynamelabel2(inputs)
	if (locale === "es") return es_family_editor_familynamelabel2(inputs)
	if (locale === "fr") return fr_family_editor_familynamelabel2(inputs)
	return ar_family_editor_familynamelabel2(inputs)
});
export { family_editor_familynamelabel2 as "family.editor.familyNameLabel" }