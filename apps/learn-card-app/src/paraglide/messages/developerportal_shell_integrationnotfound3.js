/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Integrationnotfound3Inputs */

const en_developerportal_shell_integrationnotfound3 = /** @type {(inputs: Developerportal_Shell_Integrationnotfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration Not Found`)
};

const es_developerportal_shell_integrationnotfound3 = /** @type {(inputs: Developerportal_Shell_Integrationnotfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integración No Encontrada`)
};

const fr_developerportal_shell_integrationnotfound3 = /** @type {(inputs: Developerportal_Shell_Integrationnotfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intégration Introuvable`)
};

const ar_developerportal_shell_integrationnotfound3 = /** @type {(inputs: Developerportal_Shell_Integrationnotfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التكامل غير موجود`)
};

/**
* | output |
* | --- |
* | "Integration Not Found" |
*
* @param {Developerportal_Shell_Integrationnotfound3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_integrationnotfound3 = /** @type {((inputs?: Developerportal_Shell_Integrationnotfound3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Integrationnotfound3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_integrationnotfound3(inputs)
	if (locale === "es") return es_developerportal_shell_integrationnotfound3(inputs)
	if (locale === "fr") return fr_developerportal_shell_integrationnotfound3(inputs)
	return ar_developerportal_shell_integrationnotfound3(inputs)
});
export { developerportal_shell_integrationnotfound3 as "developerPortal.shell.integrationNotFound" }