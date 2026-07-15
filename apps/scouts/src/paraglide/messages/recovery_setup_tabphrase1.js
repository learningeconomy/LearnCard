/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Tabphrase1Inputs */

const en_recovery_setup_tabphrase1 = /** @type {(inputs: Recovery_Setup_Tabphrase1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phrase`)
};

const es_recovery_setup_tabphrase1 = /** @type {(inputs: Recovery_Setup_Tabphrase1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Frase`)
};

const fr_recovery_setup_tabphrase1 = /** @type {(inputs: Recovery_Setup_Tabphrase1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phrase`)
};

const ar_recovery_setup_tabphrase1 = /** @type {(inputs: Recovery_Setup_Tabphrase1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العبارة`)
};

/**
* | output |
* | --- |
* | "Phrase" |
*
* @param {Recovery_Setup_Tabphrase1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_tabphrase1 = /** @type {((inputs?: Recovery_Setup_Tabphrase1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Tabphrase1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_tabphrase1(inputs)
	if (locale === "es") return es_recovery_setup_tabphrase1(inputs)
	if (locale === "fr") return fr_recovery_setup_tabphrase1(inputs)
	return ar_recovery_setup_tabphrase1(inputs)
});
export { recovery_setup_tabphrase1 as "recovery.setup.tabPhrase" }