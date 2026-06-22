/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Versioninfo_Appversion2Inputs */

const en_versioninfo_appversion2 = /** @type {(inputs: Versioninfo_Appversion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App version`)
};

const es_versioninfo_appversion2 = /** @type {(inputs: Versioninfo_Appversion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Versión de la app`)
};

const fr_versioninfo_appversion2 = /** @type {(inputs: Versioninfo_Appversion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Version de l’app`)
};

const ar_versioninfo_appversion2 = /** @type {(inputs: Versioninfo_Appversion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار التطبيق`)
};

/**
* | output |
* | --- |
* | "App version" |
*
* @param {Versioninfo_Appversion2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const versioninfo_appversion2 = /** @type {((inputs?: Versioninfo_Appversion2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Versioninfo_Appversion2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_versioninfo_appversion2(inputs)
	if (locale === "es") return es_versioninfo_appversion2(inputs)
	if (locale === "fr") return fr_versioninfo_appversion2(inputs)
	return ar_versioninfo_appversion2(inputs)
});
export { versioninfo_appversion2 as "versionInfo.appVersion" }