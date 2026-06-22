/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Apidocumentation2Inputs */

const en_developerportal_shell_apidocumentation2 = /** @type {(inputs: Developerportal_Shell_Apidocumentation2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API Documentation`)
};

const es_developerportal_shell_apidocumentation2 = /** @type {(inputs: Developerportal_Shell_Apidocumentation2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Documentación de API`)
};

const fr_developerportal_shell_apidocumentation2 = /** @type {(inputs: Developerportal_Shell_Apidocumentation2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Documentation API`)
};

const ar_developerportal_shell_apidocumentation2 = /** @type {(inputs: Developerportal_Shell_Apidocumentation2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`توثيق API`)
};

/**
* | output |
* | --- |
* | "API Documentation" |
*
* @param {Developerportal_Shell_Apidocumentation2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_apidocumentation2 = /** @type {((inputs?: Developerportal_Shell_Apidocumentation2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Apidocumentation2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_apidocumentation2(inputs)
	if (locale === "es") return es_developerportal_shell_apidocumentation2(inputs)
	if (locale === "fr") return fr_developerportal_shell_apidocumentation2(inputs)
	return ar_developerportal_shell_apidocumentation2(inputs)
});
export { developerportal_shell_apidocumentation2 as "developerPortal.shell.apiDocumentation" }