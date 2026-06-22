/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Yourintegrations2Inputs */

const en_developerportal_shell_yourintegrations2 = /** @type {(inputs: Developerportal_Shell_Yourintegrations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Integrations`)
};

const es_developerportal_shell_yourintegrations2 = /** @type {(inputs: Developerportal_Shell_Yourintegrations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tus Integraciones`)
};

const fr_developerportal_shell_yourintegrations2 = /** @type {(inputs: Developerportal_Shell_Yourintegrations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vos Intégrations`)
};

const ar_developerportal_shell_yourintegrations2 = /** @type {(inputs: Developerportal_Shell_Yourintegrations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكاملاتك`)
};

/**
* | output |
* | --- |
* | "Your Integrations" |
*
* @param {Developerportal_Shell_Yourintegrations2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_yourintegrations2 = /** @type {((inputs?: Developerportal_Shell_Yourintegrations2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Yourintegrations2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_yourintegrations2(inputs)
	if (locale === "es") return es_developerportal_shell_yourintegrations2(inputs)
	if (locale === "fr") return fr_developerportal_shell_yourintegrations2(inputs)
	return ar_developerportal_shell_yourintegrations2(inputs)
});
export { developerportal_shell_yourintegrations2 as "developerPortal.shell.yourIntegrations" }