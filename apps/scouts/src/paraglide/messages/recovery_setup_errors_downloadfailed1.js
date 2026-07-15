/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Errors_Downloadfailed1Inputs */

const en_recovery_setup_errors_downloadfailed1 = /** @type {(inputs: Recovery_Setup_Errors_Downloadfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Could not save the file. Please try again.`)
};

const es_recovery_setup_errors_downloadfailed1 = /** @type {(inputs: Recovery_Setup_Errors_Downloadfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo guardar el archivo. Por favor inténtalo de nuevo.`)
};

const fr_recovery_setup_errors_downloadfailed1 = /** @type {(inputs: Recovery_Setup_Errors_Downloadfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de sauvegarder le fichier. Veuillez réessayer.`)
};

const ar_recovery_setup_errors_downloadfailed1 = /** @type {(inputs: Recovery_Setup_Errors_Downloadfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Could not save the file. Please try again.`)
};

/**
* | output |
* | --- |
* | "Could not save the file. Please try again." |
*
* @param {Recovery_Setup_Errors_Downloadfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_errors_downloadfailed1 = /** @type {((inputs?: Recovery_Setup_Errors_Downloadfailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Errors_Downloadfailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_errors_downloadfailed1(inputs)
	if (locale === "es") return es_recovery_setup_errors_downloadfailed1(inputs)
	if (locale === "fr") return fr_recovery_setup_errors_downloadfailed1(inputs)
	return ar_recovery_setup_errors_downloadfailed1(inputs)
});
export { recovery_setup_errors_downloadfailed1 as "recovery.setup.errors.downloadFailed" }