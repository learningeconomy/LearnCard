/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Versioninfo_Advanced1Inputs */

const en_versioninfo_advanced1 = /** @type {(inputs: Versioninfo_Advanced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Advanced`)
};

const es_versioninfo_advanced1 = /** @type {(inputs: Versioninfo_Advanced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Avanzado`)
};

const fr_versioninfo_advanced1 = /** @type {(inputs: Versioninfo_Advanced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Avancé`)
};

const ar_versioninfo_advanced1 = /** @type {(inputs: Versioninfo_Advanced1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متقدّم`)
};

/**
* | output |
* | --- |
* | "Advanced" |
*
* @param {Versioninfo_Advanced1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const versioninfo_advanced1 = /** @type {((inputs?: Versioninfo_Advanced1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Versioninfo_Advanced1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_versioninfo_advanced1(inputs)
	if (locale === "es") return es_versioninfo_advanced1(inputs)
	if (locale === "fr") return fr_versioninfo_advanced1(inputs)
	return ar_versioninfo_advanced1(inputs)
});
export { versioninfo_advanced1 as "versionInfo.advanced" }