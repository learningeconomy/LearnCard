/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Backtoprojects3Inputs */

const en_developerportal_shell_backtoprojects3 = /** @type {(inputs: Developerportal_Shell_Backtoprojects3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back to Projects`)
};

const es_developerportal_shell_backtoprojects3 = /** @type {(inputs: Developerportal_Shell_Backtoprojects3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver a Proyectos`)
};

const fr_developerportal_shell_backtoprojects3 = /** @type {(inputs: Developerportal_Shell_Backtoprojects3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour aux Projets`)
};

const ar_developerportal_shell_backtoprojects3 = /** @type {(inputs: Developerportal_Shell_Backtoprojects3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العودة إلى المشاريع`)
};

/**
* | output |
* | --- |
* | "Back to Projects" |
*
* @param {Developerportal_Shell_Backtoprojects3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_backtoprojects3 = /** @type {((inputs?: Developerportal_Shell_Backtoprojects3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Backtoprojects3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_backtoprojects3(inputs)
	if (locale === "es") return es_developerportal_shell_backtoprojects3(inputs)
	if (locale === "fr") return fr_developerportal_shell_backtoprojects3(inputs)
	return ar_developerportal_shell_backtoprojects3(inputs)
});
export { developerportal_shell_backtoprojects3 as "developerPortal.shell.backToProjects" }