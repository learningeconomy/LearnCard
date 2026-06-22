/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Versioninfo_Copydetails2Inputs */

const en_versioninfo_copydetails2 = /** @type {(inputs: Versioninfo_Copydetails2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy details`)
};

const es_versioninfo_copydetails2 = /** @type {(inputs: Versioninfo_Copydetails2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar detalles`)
};

const fr_versioninfo_copydetails2 = /** @type {(inputs: Versioninfo_Copydetails2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier les détails`)
};

const ar_versioninfo_copydetails2 = /** @type {(inputs: Versioninfo_Copydetails2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ التفاصيل`)
};

/**
* | output |
* | --- |
* | "Copy details" |
*
* @param {Versioninfo_Copydetails2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const versioninfo_copydetails2 = /** @type {((inputs?: Versioninfo_Copydetails2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Versioninfo_Copydetails2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_versioninfo_copydetails2(inputs)
	if (locale === "es") return es_versioninfo_copydetails2(inputs)
	if (locale === "fr") return fr_versioninfo_copydetails2(inputs)
	return ar_versioninfo_copydetails2(inputs)
});
export { versioninfo_copydetails2 as "versionInfo.copyDetails" }