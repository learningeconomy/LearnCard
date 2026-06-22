/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Fullreferencedocs3Inputs */

const en_developerportal_shell_fullreferencedocs3 = /** @type {(inputs: Developerportal_Shell_Fullreferencedocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full reference docs`)
};

const es_developerportal_shell_fullreferencedocs3 = /** @type {(inputs: Developerportal_Shell_Fullreferencedocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Documentación de referencia completa`)
};

const fr_developerportal_shell_fullreferencedocs3 = /** @type {(inputs: Developerportal_Shell_Fullreferencedocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Documentation de référence complète`)
};

const ar_developerportal_shell_fullreferencedocs3 = /** @type {(inputs: Developerportal_Shell_Fullreferencedocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`توثيق مرجعي كامل`)
};

/**
* | output |
* | --- |
* | "Full reference docs" |
*
* @param {Developerportal_Shell_Fullreferencedocs3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_fullreferencedocs3 = /** @type {((inputs?: Developerportal_Shell_Fullreferencedocs3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Fullreferencedocs3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_fullreferencedocs3(inputs)
	if (locale === "es") return es_developerportal_shell_fullreferencedocs3(inputs)
	if (locale === "fr") return fr_developerportal_shell_fullreferencedocs3(inputs)
	return ar_developerportal_shell_fullreferencedocs3(inputs)
});
export { developerportal_shell_fullreferencedocs3 as "developerPortal.shell.fullReferenceDocs" }