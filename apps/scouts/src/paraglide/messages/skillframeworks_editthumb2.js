/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Editthumb2Inputs */

const en_skillframeworks_editthumb2 = /** @type {(inputs: Skillframeworks_Editthumb2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit thumbnail`)
};

const es_skillframeworks_editthumb2 = /** @type {(inputs: Skillframeworks_Editthumb2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar miniatura`)
};

const fr_skillframeworks_editthumb2 = /** @type {(inputs: Skillframeworks_Editthumb2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier la vignette`)
};

const ar_skillframeworks_editthumb2 = /** @type {(inputs: Skillframeworks_Editthumb2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل الصورة المصغرة`)
};

/**
* | output |
* | --- |
* | "Edit thumbnail" |
*
* @param {Skillframeworks_Editthumb2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_editthumb2 = /** @type {((inputs?: Skillframeworks_Editthumb2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Editthumb2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_editthumb2(inputs)
	if (locale === "es") return es_skillframeworks_editthumb2(inputs)
	if (locale === "fr") return fr_skillframeworks_editthumb2(inputs)
	return ar_skillframeworks_editthumb2(inputs)
});
export { skillframeworks_editthumb2 as "skillFrameworks.editThumb" }