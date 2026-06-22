/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Versioninfo_Lastupdated2Inputs */

const en_versioninfo_lastupdated2 = /** @type {(inputs: Versioninfo_Lastupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Last updated`)
};

const es_versioninfo_lastupdated2 = /** @type {(inputs: Versioninfo_Lastupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Última actualización`)
};

const fr_versioninfo_lastupdated2 = /** @type {(inputs: Versioninfo_Lastupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dernière mise à jour`)
};

const ar_versioninfo_lastupdated2 = /** @type {(inputs: Versioninfo_Lastupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`آخر تحديث`)
};

/**
* | output |
* | --- |
* | "Last updated" |
*
* @param {Versioninfo_Lastupdated2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const versioninfo_lastupdated2 = /** @type {((inputs?: Versioninfo_Lastupdated2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Versioninfo_Lastupdated2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_versioninfo_lastupdated2(inputs)
	if (locale === "es") return es_versioninfo_lastupdated2(inputs)
	if (locale === "fr") return fr_versioninfo_lastupdated2(inputs)
	return ar_versioninfo_lastupdated2(inputs)
});
export { versioninfo_lastupdated2 as "versionInfo.lastUpdated" }