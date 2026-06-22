/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Continuesetup2Inputs */

const en_developerportal_shell_continuesetup2 = /** @type {(inputs: Developerportal_Shell_Continuesetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue Setup`)
};

const es_developerportal_shell_continuesetup2 = /** @type {(inputs: Developerportal_Shell_Continuesetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar Configuración`)
};

const fr_developerportal_shell_continuesetup2 = /** @type {(inputs: Developerportal_Shell_Continuesetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer la Configuration`)
};

const ar_developerportal_shell_continuesetup2 = /** @type {(inputs: Developerportal_Shell_Continuesetup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة الإعداد`)
};

/**
* | output |
* | --- |
* | "Continue Setup" |
*
* @param {Developerportal_Shell_Continuesetup2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_continuesetup2 = /** @type {((inputs?: Developerportal_Shell_Continuesetup2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Continuesetup2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_continuesetup2(inputs)
	if (locale === "es") return es_developerportal_shell_continuesetup2(inputs)
	if (locale === "fr") return fr_developerportal_shell_continuesetup2(inputs)
	return ar_developerportal_shell_continuesetup2(inputs)
});
export { developerportal_shell_continuesetup2 as "developerPortal.shell.continueSetup" }