/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Exportfwdesc3Inputs */

const en_skillframeworks_exportfwdesc3 = /** @type {(inputs: Skillframeworks_Exportfwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Export your current framework, make changes and re-upload.`)
};

const es_skillframeworks_exportfwdesc3 = /** @type {(inputs: Skillframeworks_Exportfwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exporta tu marco actual, haz cambios y vuelve a subirlo.`)
};

const fr_skillframeworks_exportfwdesc3 = /** @type {(inputs: Skillframeworks_Exportfwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exportez votre cadre actuel, apportez des modifications et rechargez-le.`)
};

const ar_skillframeworks_exportfwdesc3 = /** @type {(inputs: Skillframeworks_Exportfwdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صدّر إطارك الحالي، وقم بإجراء تغييرات، وأعد الرفع.`)
};

/**
* | output |
* | --- |
* | "Export your current framework, make changes and re-upload." |
*
* @param {Skillframeworks_Exportfwdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_exportfwdesc3 = /** @type {((inputs?: Skillframeworks_Exportfwdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Exportfwdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_exportfwdesc3(inputs)
	if (locale === "es") return es_skillframeworks_exportfwdesc3(inputs)
	if (locale === "fr") return fr_skillframeworks_exportfwdesc3(inputs)
	return ar_skillframeworks_exportfwdesc3(inputs)
});
export { skillframeworks_exportfwdesc3 as "skillFrameworks.exportFwDesc" }