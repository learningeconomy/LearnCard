/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Reviewapprovebeforesave4Inputs */

const en_skillframeworks_reviewapprovebeforesave4 = /** @type {(inputs: Skillframeworks_Reviewapprovebeforesave4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Review & Approve Before Saving`)
};

const es_skillframeworks_reviewapprovebeforesave4 = /** @type {(inputs: Skillframeworks_Reviewapprovebeforesave4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revisar y Aprobar Antes de Guardar`)
};

const fr_skillframeworks_reviewapprovebeforesave4 = /** @type {(inputs: Skillframeworks_Reviewapprovebeforesave4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réviser et approuver avant d'enregistrer`)
};

const ar_skillframeworks_reviewapprovebeforesave4 = /** @type {(inputs: Skillframeworks_Reviewapprovebeforesave4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Review & Approve Before Saving`)
};

/**
* | output |
* | --- |
* | "Review & Approve Before Saving" |
*
* @param {Skillframeworks_Reviewapprovebeforesave4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_reviewapprovebeforesave4 = /** @type {((inputs?: Skillframeworks_Reviewapprovebeforesave4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Reviewapprovebeforesave4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_reviewapprovebeforesave4(inputs)
	if (locale === "es") return es_skillframeworks_reviewapprovebeforesave4(inputs)
	if (locale === "fr") return fr_skillframeworks_reviewapprovebeforesave4(inputs)
	return ar_skillframeworks_reviewapprovebeforesave4(inputs)
});
export { skillframeworks_reviewapprovebeforesave4 as "skillFrameworks.reviewApproveBeforeSave" }