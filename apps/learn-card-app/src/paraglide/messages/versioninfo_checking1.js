/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Versioninfo_Checking1Inputs */

const en_versioninfo_checking1 = /** @type {(inputs: Versioninfo_Checking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking…`)
};

const es_versioninfo_checking1 = /** @type {(inputs: Versioninfo_Checking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscando…`)
};

const fr_versioninfo_checking1 = /** @type {(inputs: Versioninfo_Checking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recherche…`)
};

const ar_versioninfo_checking1 = /** @type {(inputs: Versioninfo_Checking1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التحقق…`)
};

/**
* | output |
* | --- |
* | "Checking…" |
*
* @param {Versioninfo_Checking1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const versioninfo_checking1 = /** @type {((inputs?: Versioninfo_Checking1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Versioninfo_Checking1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_versioninfo_checking1(inputs)
	if (locale === "es") return es_versioninfo_checking1(inputs)
	if (locale === "fr") return fr_versioninfo_checking1(inputs)
	return ar_versioninfo_checking1(inputs)
});
export { versioninfo_checking1 as "versionInfo.checking" }