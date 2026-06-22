/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Newprojectplaceholder3Inputs */

const en_developerportal_shell_newprojectplaceholder3 = /** @type {(inputs: Developerportal_Shell_Newprojectplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New project name...`)
};

const es_developerportal_shell_newprojectplaceholder3 = /** @type {(inputs: Developerportal_Shell_Newprojectplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del nuevo proyecto...`)
};

const fr_developerportal_shell_newprojectplaceholder3 = /** @type {(inputs: Developerportal_Shell_Newprojectplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du nouveau projet...`)
};

const ar_developerportal_shell_newprojectplaceholder3 = /** @type {(inputs: Developerportal_Shell_Newprojectplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم المشروع الجديد...`)
};

/**
* | output |
* | --- |
* | "New project name..." |
*
* @param {Developerportal_Shell_Newprojectplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_newprojectplaceholder3 = /** @type {((inputs?: Developerportal_Shell_Newprojectplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Newprojectplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_newprojectplaceholder3(inputs)
	if (locale === "es") return es_developerportal_shell_newprojectplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_shell_newprojectplaceholder3(inputs)
	return ar_developerportal_shell_newprojectplaceholder3(inputs)
});
export { developerportal_shell_newprojectplaceholder3 as "developerPortal.shell.newProjectPlaceholder" }