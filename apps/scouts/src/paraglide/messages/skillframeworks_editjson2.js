/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Editjson2Inputs */

const en_skillframeworks_editjson2 = /** @type {(inputs: Skillframeworks_Editjson2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit JSON`)
};

const es_skillframeworks_editjson2 = /** @type {(inputs: Skillframeworks_Editjson2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar JSON`)
};

const fr_skillframeworks_editjson2 = /** @type {(inputs: Skillframeworks_Editjson2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier le JSON`)
};

const ar_skillframeworks_editjson2 = /** @type {(inputs: Skillframeworks_Editjson2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit JSON`)
};

/**
* | output |
* | --- |
* | "Edit JSON" |
*
* @param {Skillframeworks_Editjson2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_editjson2 = /** @type {((inputs?: Skillframeworks_Editjson2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Editjson2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_editjson2(inputs)
	if (locale === "es") return es_skillframeworks_editjson2(inputs)
	if (locale === "fr") return fr_skillframeworks_editjson2(inputs)
	return ar_skillframeworks_editjson2(inputs)
});
export { skillframeworks_editjson2 as "skillFrameworks.editJson" }