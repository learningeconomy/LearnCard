/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Statusinsetup3Inputs */

const en_developerportal_shell_statusinsetup3 = /** @type {(inputs: Developerportal_Shell_Statusinsetup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`In Setup`)
};

const es_developerportal_shell_statusinsetup3 = /** @type {(inputs: Developerportal_Shell_Statusinsetup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En Configuración`)
};

const fr_developerportal_shell_statusinsetup3 = /** @type {(inputs: Developerportal_Shell_Statusinsetup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En Configuration`)
};

const ar_developerportal_shell_statusinsetup3 = /** @type {(inputs: Developerportal_Shell_Statusinsetup3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قيد الإعداد`)
};

/**
* | output |
* | --- |
* | "In Setup" |
*
* @param {Developerportal_Shell_Statusinsetup3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_statusinsetup3 = /** @type {((inputs?: Developerportal_Shell_Statusinsetup3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Statusinsetup3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_statusinsetup3(inputs)
	if (locale === "es") return es_developerportal_shell_statusinsetup3(inputs)
	if (locale === "fr") return fr_developerportal_shell_statusinsetup3(inputs)
	return ar_developerportal_shell_statusinsetup3(inputs)
});
export { developerportal_shell_statusinsetup3 as "developerPortal.shell.statusInSetup" }