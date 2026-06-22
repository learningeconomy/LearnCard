/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Issued1Inputs */

const en_developerportal_shell_issued1 = /** @type {(inputs: Developerportal_Shell_Issued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`issued`)
};

const es_developerportal_shell_issued1 = /** @type {(inputs: Developerportal_Shell_Issued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`emitidos`)
};

const fr_developerportal_shell_issued1 = /** @type {(inputs: Developerportal_Shell_Issued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`émis`)
};

const ar_developerportal_shell_issued1 = /** @type {(inputs: Developerportal_Shell_Issued1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صدر`)
};

/**
* | output |
* | --- |
* | "issued" |
*
* @param {Developerportal_Shell_Issued1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_issued1 = /** @type {((inputs?: Developerportal_Shell_Issued1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Issued1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_issued1(inputs)
	if (locale === "es") return es_developerportal_shell_issued1(inputs)
	if (locale === "fr") return fr_developerportal_shell_issued1(inputs)
	return ar_developerportal_shell_issued1(inputs)
});
export { developerportal_shell_issued1 as "developerPortal.shell.issued" }