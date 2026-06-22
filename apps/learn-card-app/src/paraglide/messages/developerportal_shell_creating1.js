/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Creating1Inputs */

const en_developerportal_shell_creating1 = /** @type {(inputs: Developerportal_Shell_Creating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creating...`)
};

const es_developerportal_shell_creating1 = /** @type {(inputs: Developerportal_Shell_Creating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creando...`)
};

const fr_developerportal_shell_creating1 = /** @type {(inputs: Developerportal_Shell_Creating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Création...`)
};

const ar_developerportal_shell_creating1 = /** @type {(inputs: Developerportal_Shell_Creating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الإنشاء...`)
};

/**
* | output |
* | --- |
* | "Creating..." |
*
* @param {Developerportal_Shell_Creating1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_creating1 = /** @type {((inputs?: Developerportal_Shell_Creating1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Creating1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_creating1(inputs)
	if (locale === "es") return es_developerportal_shell_creating1(inputs)
	if (locale === "fr") return fr_developerportal_shell_creating1(inputs)
	return ar_developerportal_shell_creating1(inputs)
});
export { developerportal_shell_creating1 as "developerPortal.shell.creating" }