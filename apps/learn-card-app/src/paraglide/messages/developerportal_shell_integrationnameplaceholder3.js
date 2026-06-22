/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Integrationnameplaceholder3Inputs */

const en_developerportal_shell_integrationnameplaceholder3 = /** @type {(inputs: Developerportal_Shell_Integrationnameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., AARP Skills Builder`)
};

const es_developerportal_shell_integrationnameplaceholder3 = /** @type {(inputs: Developerportal_Shell_Integrationnameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`p.ej., AARP Skills Builder`)
};

const fr_developerportal_shell_integrationnameplaceholder3 = /** @type {(inputs: Developerportal_Shell_Integrationnameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`p.ex., AARP Skills Builder`)
};

const ar_developerportal_shell_integrationnameplaceholder3 = /** @type {(inputs: Developerportal_Shell_Integrationnameplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: AARP Skills Builder`)
};

/**
* | output |
* | --- |
* | "e.g., AARP Skills Builder" |
*
* @param {Developerportal_Shell_Integrationnameplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_integrationnameplaceholder3 = /** @type {((inputs?: Developerportal_Shell_Integrationnameplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Integrationnameplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_integrationnameplaceholder3(inputs)
	if (locale === "es") return es_developerportal_shell_integrationnameplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_shell_integrationnameplaceholder3(inputs)
	return ar_developerportal_shell_integrationnameplaceholder3(inputs)
});
export { developerportal_shell_integrationnameplaceholder3 as "developerPortal.shell.integrationNamePlaceholder" }