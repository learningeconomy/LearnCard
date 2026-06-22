/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Stepbysteptutorials4Inputs */

const en_developerportal_shell_stepbysteptutorials4 = /** @type {(inputs: Developerportal_Shell_Stepbysteptutorials4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Step-by-step tutorials`)
};

const es_developerportal_shell_stepbysteptutorials4 = /** @type {(inputs: Developerportal_Shell_Stepbysteptutorials4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tutoriales paso a paso`)
};

const fr_developerportal_shell_stepbysteptutorials4 = /** @type {(inputs: Developerportal_Shell_Stepbysteptutorials4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tutoriels pas à pas`)
};

const ar_developerportal_shell_stepbysteptutorials4 = /** @type {(inputs: Developerportal_Shell_Stepbysteptutorials4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دروس تعليمية خطوة بخطوة`)
};

/**
* | output |
* | --- |
* | "Step-by-step tutorials" |
*
* @param {Developerportal_Shell_Stepbysteptutorials4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_stepbysteptutorials4 = /** @type {((inputs?: Developerportal_Shell_Stepbysteptutorials4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Stepbysteptutorials4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_stepbysteptutorials4(inputs)
	if (locale === "es") return es_developerportal_shell_stepbysteptutorials4(inputs)
	if (locale === "fr") return fr_developerportal_shell_stepbysteptutorials4(inputs)
	return ar_developerportal_shell_stepbysteptutorials4(inputs)
});
export { developerportal_shell_stepbysteptutorials4 as "developerPortal.shell.stepByStepTutorials" }