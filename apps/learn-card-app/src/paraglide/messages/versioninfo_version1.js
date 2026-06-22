/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Versioninfo_Version1Inputs */

const en_versioninfo_version1 = /** @type {(inputs: Versioninfo_Version1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Version`)
};

const es_versioninfo_version1 = /** @type {(inputs: Versioninfo_Version1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Versión`)
};

const fr_versioninfo_version1 = /** @type {(inputs: Versioninfo_Version1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Version`)
};

const ar_versioninfo_version1 = /** @type {(inputs: Versioninfo_Version1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإصدار`)
};

/**
* | output |
* | --- |
* | "Version" |
*
* @param {Versioninfo_Version1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const versioninfo_version1 = /** @type {((inputs?: Versioninfo_Version1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Versioninfo_Version1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_versioninfo_version1(inputs)
	if (locale === "es") return es_versioninfo_version1(inputs)
	if (locale === "fr") return fr_versioninfo_version1(inputs)
	return ar_versioninfo_version1(inputs)
});
export { versioninfo_version1 as "versionInfo.version" }