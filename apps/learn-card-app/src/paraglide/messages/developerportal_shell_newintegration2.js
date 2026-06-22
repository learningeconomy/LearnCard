/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Newintegration2Inputs */

const en_developerportal_shell_newintegration2 = /** @type {(inputs: Developerportal_Shell_Newintegration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Integration`)
};

const es_developerportal_shell_newintegration2 = /** @type {(inputs: Developerportal_Shell_Newintegration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva Integración`)
};

const fr_developerportal_shell_newintegration2 = /** @type {(inputs: Developerportal_Shell_Newintegration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle Intégration`)
};

const ar_developerportal_shell_newintegration2 = /** @type {(inputs: Developerportal_Shell_Newintegration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكامل جديد`)
};

/**
* | output |
* | --- |
* | "New Integration" |
*
* @param {Developerportal_Shell_Newintegration2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_newintegration2 = /** @type {((inputs?: Developerportal_Shell_Newintegration2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Newintegration2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_newintegration2(inputs)
	if (locale === "es") return es_developerportal_shell_newintegration2(inputs)
	if (locale === "fr") return fr_developerportal_shell_newintegration2(inputs)
	return ar_developerportal_shell_newintegration2(inputs)
});
export { developerportal_shell_newintegration2 as "developerPortal.shell.newIntegration" }