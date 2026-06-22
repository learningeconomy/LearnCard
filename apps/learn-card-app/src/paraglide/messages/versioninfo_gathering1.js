/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Versioninfo_Gathering1Inputs */

const en_versioninfo_gathering1 = /** @type {(inputs: Versioninfo_Gathering1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gathering version info…`)
};

const es_versioninfo_gathering1 = /** @type {(inputs: Versioninfo_Gathering1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obteniendo información de versión…`)
};

const fr_versioninfo_gathering1 = /** @type {(inputs: Versioninfo_Gathering1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupération des informations de version…`)
};

const ar_versioninfo_gathering1 = /** @type {(inputs: Versioninfo_Gathering1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ جمع معلومات الإصدار…`)
};

/**
* | output |
* | --- |
* | "Gathering version info…" |
*
* @param {Versioninfo_Gathering1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const versioninfo_gathering1 = /** @type {((inputs?: Versioninfo_Gathering1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Versioninfo_Gathering1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_versioninfo_gathering1(inputs)
	if (locale === "es") return es_versioninfo_gathering1(inputs)
	if (locale === "fr") return fr_versioninfo_gathering1(inputs)
	return ar_versioninfo_gathering1(inputs)
});
export { versioninfo_gathering1 as "versionInfo.gathering" }