/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Shell_Integrationcount2Inputs */

const en_developerportal_shell_integrationcount2 = /** @type {(inputs: Developerportal_Shell_Integrationcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} integration`)
};

const es_developerportal_shell_integrationcount2 = /** @type {(inputs: Developerportal_Shell_Integrationcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} integración`)
};

const fr_developerportal_shell_integrationcount2 = /** @type {(inputs: Developerportal_Shell_Integrationcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} intégration`)
};

const ar_developerportal_shell_integrationcount2 = /** @type {(inputs: Developerportal_Shell_Integrationcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} تكامل`)
};

/**
* | output |
* | --- |
* | "{count} integration" |
*
* @param {Developerportal_Shell_Integrationcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_integrationcount2 = /** @type {((inputs: Developerportal_Shell_Integrationcount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Integrationcount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_integrationcount2(inputs)
	if (locale === "es") return es_developerportal_shell_integrationcount2(inputs)
	if (locale === "fr") return fr_developerportal_shell_integrationcount2(inputs)
	return ar_developerportal_shell_integrationcount2(inputs)
});
export { developerportal_shell_integrationcount2 as "developerPortal.shell.integrationCount" }