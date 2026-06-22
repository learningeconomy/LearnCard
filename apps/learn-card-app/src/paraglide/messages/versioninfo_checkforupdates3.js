/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Versioninfo_Checkforupdates3Inputs */

const en_versioninfo_checkforupdates3 = /** @type {(inputs: Versioninfo_Checkforupdates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check for updates`)
};

const es_versioninfo_checkforupdates3 = /** @type {(inputs: Versioninfo_Checkforupdates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar actualizaciones`)
};

const fr_versioninfo_checkforupdates3 = /** @type {(inputs: Versioninfo_Checkforupdates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des mises à jour`)
};

const ar_versioninfo_checkforupdates3 = /** @type {(inputs: Versioninfo_Checkforupdates3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التحقق من التحديثات`)
};

/**
* | output |
* | --- |
* | "Check for updates" |
*
* @param {Versioninfo_Checkforupdates3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const versioninfo_checkforupdates3 = /** @type {((inputs?: Versioninfo_Checkforupdates3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Versioninfo_Checkforupdates3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_versioninfo_checkforupdates3(inputs)
	if (locale === "es") return es_versioninfo_checkforupdates3(inputs)
	if (locale === "fr") return fr_versioninfo_checkforupdates3(inputs)
	return ar_versioninfo_checkforupdates3(inputs)
});
export { versioninfo_checkforupdates3 as "versionInfo.checkForUpdates" }