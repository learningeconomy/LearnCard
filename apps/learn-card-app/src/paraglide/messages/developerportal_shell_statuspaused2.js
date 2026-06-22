/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Statuspaused2Inputs */

const en_developerportal_shell_statuspaused2 = /** @type {(inputs: Developerportal_Shell_Statuspaused2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paused`)
};

const es_developerportal_shell_statuspaused2 = /** @type {(inputs: Developerportal_Shell_Statuspaused2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pausado`)
};

const fr_developerportal_shell_statuspaused2 = /** @type {(inputs: Developerportal_Shell_Statuspaused2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En pause`)
};

const ar_developerportal_shell_statuspaused2 = /** @type {(inputs: Developerportal_Shell_Statuspaused2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متوقف مؤقتاً`)
};

/**
* | output |
* | --- |
* | "Paused" |
*
* @param {Developerportal_Shell_Statuspaused2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_statuspaused2 = /** @type {((inputs?: Developerportal_Shell_Statuspaused2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Statuspaused2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_statuspaused2(inputs)
	if (locale === "es") return es_developerportal_shell_statuspaused2(inputs)
	if (locale === "fr") return fr_developerportal_shell_statuspaused2(inputs)
	return ar_developerportal_shell_statuspaused2(inputs)
});
export { developerportal_shell_statuspaused2 as "developerPortal.shell.statusPaused" }