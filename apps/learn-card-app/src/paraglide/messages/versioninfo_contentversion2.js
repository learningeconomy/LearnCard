/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Versioninfo_Contentversion2Inputs */

const en_versioninfo_contentversion2 = /** @type {(inputs: Versioninfo_Contentversion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Content version`)
};

const es_versioninfo_contentversion2 = /** @type {(inputs: Versioninfo_Contentversion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Versión de contenido`)
};

const fr_versioninfo_contentversion2 = /** @type {(inputs: Versioninfo_Contentversion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Version du contenu`)
};

const ar_versioninfo_contentversion2 = /** @type {(inputs: Versioninfo_Contentversion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار المحتوى`)
};

/**
* | output |
* | --- |
* | "Content version" |
*
* @param {Versioninfo_Contentversion2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const versioninfo_contentversion2 = /** @type {((inputs?: Versioninfo_Contentversion2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Versioninfo_Contentversion2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_versioninfo_contentversion2(inputs)
	if (locale === "es") return es_versioninfo_contentversion2(inputs)
	if (locale === "fr") return fr_versioninfo_contentversion2(inputs)
	return ar_versioninfo_contentversion2(inputs)
});
export { versioninfo_contentversion2 as "versionInfo.contentVersion" }