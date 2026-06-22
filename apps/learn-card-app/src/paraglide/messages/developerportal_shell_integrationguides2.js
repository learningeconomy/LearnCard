/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Integrationguides2Inputs */

const en_developerportal_shell_integrationguides2 = /** @type {(inputs: Developerportal_Shell_Integrationguides2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration Guides`)
};

const es_developerportal_shell_integrationguides2 = /** @type {(inputs: Developerportal_Shell_Integrationguides2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guías de Integración`)
};

const fr_developerportal_shell_integrationguides2 = /** @type {(inputs: Developerportal_Shell_Integrationguides2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guides d'Intégration`)
};

const ar_developerportal_shell_integrationguides2 = /** @type {(inputs: Developerportal_Shell_Integrationguides2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدلة التكامل`)
};

/**
* | output |
* | --- |
* | "Integration Guides" |
*
* @param {Developerportal_Shell_Integrationguides2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_integrationguides2 = /** @type {((inputs?: Developerportal_Shell_Integrationguides2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Integrationguides2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_integrationguides2(inputs)
	if (locale === "es") return es_developerportal_shell_integrationguides2(inputs)
	if (locale === "fr") return fr_developerportal_shell_integrationguides2(inputs)
	return ar_developerportal_shell_integrationguides2(inputs)
});
export { developerportal_shell_integrationguides2 as "developerPortal.shell.integrationGuides" }