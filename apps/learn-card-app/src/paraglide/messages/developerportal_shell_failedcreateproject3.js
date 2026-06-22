/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Failedcreateproject3Inputs */

const en_developerportal_shell_failedcreateproject3 = /** @type {(inputs: Developerportal_Shell_Failedcreateproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to create project`)
};

const es_developerportal_shell_failedcreateproject3 = /** @type {(inputs: Developerportal_Shell_Failedcreateproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al crear el proyecto`)
};

const fr_developerportal_shell_failedcreateproject3 = /** @type {(inputs: Developerportal_Shell_Failedcreateproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la création du projet`)
};

const ar_developerportal_shell_failedcreateproject3 = /** @type {(inputs: Developerportal_Shell_Failedcreateproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إنشاء المشروع`)
};

/**
* | output |
* | --- |
* | "Failed to create project" |
*
* @param {Developerportal_Shell_Failedcreateproject3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_failedcreateproject3 = /** @type {((inputs?: Developerportal_Shell_Failedcreateproject3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Failedcreateproject3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_failedcreateproject3(inputs)
	if (locale === "es") return es_developerportal_shell_failedcreateproject3(inputs)
	if (locale === "fr") return fr_developerportal_shell_failedcreateproject3(inputs)
	return ar_developerportal_shell_failedcreateproject3(inputs)
});
export { developerportal_shell_failedcreateproject3 as "developerPortal.shell.failedCreateProject" }