/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Myintegrations2Inputs */

const en_developerportal_shell_myintegrations2 = /** @type {(inputs: Developerportal_Shell_Myintegrations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Integrations`)
};

const es_developerportal_shell_myintegrations2 = /** @type {(inputs: Developerportal_Shell_Myintegrations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mis Integraciones`)
};

const fr_developerportal_shell_myintegrations2 = /** @type {(inputs: Developerportal_Shell_Myintegrations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mes Intégrations`)
};

const ar_developerportal_shell_myintegrations2 = /** @type {(inputs: Developerportal_Shell_Myintegrations2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكاملاتي`)
};

/**
* | output |
* | --- |
* | "My Integrations" |
*
* @param {Developerportal_Shell_Myintegrations2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_myintegrations2 = /** @type {((inputs?: Developerportal_Shell_Myintegrations2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Myintegrations2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_myintegrations2(inputs)
	if (locale === "es") return es_developerportal_shell_myintegrations2(inputs)
	if (locale === "fr") return fr_developerportal_shell_myintegrations2(inputs)
	return ar_developerportal_shell_myintegrations2(inputs)
});
export { developerportal_shell_myintegrations2 as "developerPortal.shell.myIntegrations" }