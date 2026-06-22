/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Versioninfo_Platform1Inputs */

const en_versioninfo_platform1 = /** @type {(inputs: Versioninfo_Platform1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Platform`)
};

const es_versioninfo_platform1 = /** @type {(inputs: Versioninfo_Platform1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plataforma`)
};

const fr_versioninfo_platform1 = /** @type {(inputs: Versioninfo_Platform1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plateforme`)
};

const ar_versioninfo_platform1 = /** @type {(inputs: Versioninfo_Platform1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المنصة`)
};

/**
* | output |
* | --- |
* | "Platform" |
*
* @param {Versioninfo_Platform1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const versioninfo_platform1 = /** @type {((inputs?: Versioninfo_Platform1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Versioninfo_Platform1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_versioninfo_platform1(inputs)
	if (locale === "es") return es_versioninfo_platform1(inputs)
	if (locale === "fr") return fr_versioninfo_platform1(inputs)
	return ar_versioninfo_platform1(inputs)
});
export { versioninfo_platform1 as "versionInfo.platform" }