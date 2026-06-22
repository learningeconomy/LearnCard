/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Templates1Inputs */

const en_developerportal_shell_templates1 = /** @type {(inputs: Developerportal_Shell_Templates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`templates`)
};

const es_developerportal_shell_templates1 = /** @type {(inputs: Developerportal_Shell_Templates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`plantillas`)
};

const fr_developerportal_shell_templates1 = /** @type {(inputs: Developerportal_Shell_Templates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`modèles`)
};

const ar_developerportal_shell_templates1 = /** @type {(inputs: Developerportal_Shell_Templates1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قوالب`)
};

/**
* | output |
* | --- |
* | "templates" |
*
* @param {Developerportal_Shell_Templates1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_templates1 = /** @type {((inputs?: Developerportal_Shell_Templates1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Templates1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_templates1(inputs)
	if (locale === "es") return es_developerportal_shell_templates1(inputs)
	if (locale === "fr") return fr_developerportal_shell_templates1(inputs)
	return ar_developerportal_shell_templates1(inputs)
});
export { developerportal_shell_templates1 as "developerPortal.shell.templates" }