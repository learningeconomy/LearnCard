/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Versioninfo_Nativeversion2Inputs */

const en_versioninfo_nativeversion2 = /** @type {(inputs: Versioninfo_Nativeversion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Native version`)
};

const es_versioninfo_nativeversion2 = /** @type {(inputs: Versioninfo_Nativeversion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Versión nativa`)
};

const fr_versioninfo_nativeversion2 = /** @type {(inputs: Versioninfo_Nativeversion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Version native`)
};

const ar_versioninfo_nativeversion2 = /** @type {(inputs: Versioninfo_Nativeversion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإصدار الأصلي`)
};

/**
* | output |
* | --- |
* | "Native version" |
*
* @param {Versioninfo_Nativeversion2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const versioninfo_nativeversion2 = /** @type {((inputs?: Versioninfo_Nativeversion2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Versioninfo_Nativeversion2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_versioninfo_nativeversion2(inputs)
	if (locale === "es") return es_versioninfo_nativeversion2(inputs)
	if (locale === "fr") return fr_versioninfo_nativeversion2(inputs)
	return ar_versioninfo_nativeversion2(inputs)
});
export { versioninfo_nativeversion2 as "versionInfo.nativeVersion" }