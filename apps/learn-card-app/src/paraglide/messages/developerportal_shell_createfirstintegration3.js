/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Createfirstintegration3Inputs */

const en_developerportal_shell_createfirstintegration3 = /** @type {(inputs: Developerportal_Shell_Createfirstintegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Your First Integration`)
};

const es_developerportal_shell_createfirstintegration3 = /** @type {(inputs: Developerportal_Shell_Createfirstintegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea tu Primera Integración`)
};

const fr_developerportal_shell_createfirstintegration3 = /** @type {(inputs: Developerportal_Shell_Createfirstintegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez votre Première Intégration`)
};

const ar_developerportal_shell_createfirstintegration3 = /** @type {(inputs: Developerportal_Shell_Createfirstintegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ تكاملك الأول`)
};

/**
* | output |
* | --- |
* | "Create Your First Integration" |
*
* @param {Developerportal_Shell_Createfirstintegration3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_createfirstintegration3 = /** @type {((inputs?: Developerportal_Shell_Createfirstintegration3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Createfirstintegration3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_createfirstintegration3(inputs)
	if (locale === "es") return es_developerportal_shell_createfirstintegration3(inputs)
	if (locale === "fr") return fr_developerportal_shell_createfirstintegration3(inputs)
	return ar_developerportal_shell_createfirstintegration3(inputs)
});
export { developerportal_shell_createfirstintegration3 as "developerPortal.shell.createFirstIntegration" }