/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Idlabel2Inputs */

const en_developerportal_shell_idlabel2 = /** @type {(inputs: Developerportal_Shell_Idlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID:`)
};

const es_developerportal_shell_idlabel2 = /** @type {(inputs: Developerportal_Shell_Idlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID:`)
};

const fr_developerportal_shell_idlabel2 = /** @type {(inputs: Developerportal_Shell_Idlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID :`)
};

const ar_developerportal_shell_idlabel2 = /** @type {(inputs: Developerportal_Shell_Idlabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المعرف:`)
};

/**
* | output |
* | --- |
* | "ID:" |
*
* @param {Developerportal_Shell_Idlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_idlabel2 = /** @type {((inputs?: Developerportal_Shell_Idlabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Idlabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_idlabel2(inputs)
	if (locale === "es") return es_developerportal_shell_idlabel2(inputs)
	if (locale === "fr") return fr_developerportal_shell_idlabel2(inputs)
	return ar_developerportal_shell_idlabel2(inputs)
});
export { developerportal_shell_idlabel2 as "developerPortal.shell.idLabel" }