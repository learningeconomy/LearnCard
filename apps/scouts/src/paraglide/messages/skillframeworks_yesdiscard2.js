/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Yesdiscard2Inputs */

const en_skillframeworks_yesdiscard2 = /** @type {(inputs: Skillframeworks_Yesdiscard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes, Discard Changes`)
};

const es_skillframeworks_yesdiscard2 = /** @type {(inputs: Skillframeworks_Yesdiscard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sí, Descartar Cambios`)
};

const fr_skillframeworks_yesdiscard2 = /** @type {(inputs: Skillframeworks_Yesdiscard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oui, annuler les modifications`)
};

const ar_skillframeworks_yesdiscard2 = /** @type {(inputs: Skillframeworks_Yesdiscard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نعم، تجاهل التغييرات`)
};

/**
* | output |
* | --- |
* | "Yes, Discard Changes" |
*
* @param {Skillframeworks_Yesdiscard2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_yesdiscard2 = /** @type {((inputs?: Skillframeworks_Yesdiscard2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Yesdiscard2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_yesdiscard2(inputs)
	if (locale === "es") return es_skillframeworks_yesdiscard2(inputs)
	if (locale === "fr") return fr_skillframeworks_yesdiscard2(inputs)
	return ar_skillframeworks_yesdiscard2(inputs)
});
export { skillframeworks_yesdiscard2 as "skillFrameworks.yesDiscard" }