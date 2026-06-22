/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Integrationname2Inputs */

const en_developerportal_shell_integrationname2 = /** @type {(inputs: Developerportal_Shell_Integrationname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration Name`)
};

const es_developerportal_shell_integrationname2 = /** @type {(inputs: Developerportal_Shell_Integrationname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de la Integración`)
};

const fr_developerportal_shell_integrationname2 = /** @type {(inputs: Developerportal_Shell_Integrationname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom de l'Intégration`)
};

const ar_developerportal_shell_integrationname2 = /** @type {(inputs: Developerportal_Shell_Integrationname2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم التكامل`)
};

/**
* | output |
* | --- |
* | "Integration Name" |
*
* @param {Developerportal_Shell_Integrationname2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_integrationname2 = /** @type {((inputs?: Developerportal_Shell_Integrationname2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Integrationname2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_integrationname2(inputs)
	if (locale === "es") return es_developerportal_shell_integrationname2(inputs)
	if (locale === "fr") return fr_developerportal_shell_integrationname2(inputs)
	return ar_developerportal_shell_integrationname2(inputs)
});
export { developerportal_shell_integrationname2 as "developerPortal.shell.integrationName" }