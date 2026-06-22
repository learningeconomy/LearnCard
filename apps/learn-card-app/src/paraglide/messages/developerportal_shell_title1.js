/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Title1Inputs */

const en_developerportal_shell_title1 = /** @type {(inputs: Developerportal_Shell_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Developer Portal`)
};

const es_developerportal_shell_title1 = /** @type {(inputs: Developerportal_Shell_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portal de Desarrolladores`)
};

const fr_developerportal_shell_title1 = /** @type {(inputs: Developerportal_Shell_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portail Développeur`)
};

const ar_developerportal_shell_title1 = /** @type {(inputs: Developerportal_Shell_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بوابة المطورين`)
};

/**
* | output |
* | --- |
* | "Developer Portal" |
*
* @param {Developerportal_Shell_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_title1 = /** @type {((inputs?: Developerportal_Shell_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_title1(inputs)
	if (locale === "es") return es_developerportal_shell_title1(inputs)
	if (locale === "fr") return fr_developerportal_shell_title1(inputs)
	return ar_developerportal_shell_title1(inputs)
});
export { developerportal_shell_title1 as "developerPortal.shell.title" }