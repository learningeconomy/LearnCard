/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Createproject2Inputs */

const en_developerportal_shell_createproject2 = /** @type {(inputs: Developerportal_Shell_Createproject2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Project`)
};

const es_developerportal_shell_createproject2 = /** @type {(inputs: Developerportal_Shell_Createproject2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Proyecto`)
};

const fr_developerportal_shell_createproject2 = /** @type {(inputs: Developerportal_Shell_Createproject2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un Projet`)
};

const ar_developerportal_shell_createproject2 = /** @type {(inputs: Developerportal_Shell_Createproject2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء مشروع`)
};

/**
* | output |
* | --- |
* | "Create Project" |
*
* @param {Developerportal_Shell_Createproject2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_createproject2 = /** @type {((inputs?: Developerportal_Shell_Createproject2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Createproject2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_createproject2(inputs)
	if (locale === "es") return es_developerportal_shell_createproject2(inputs)
	if (locale === "fr") return fr_developerportal_shell_createproject2(inputs)
	return ar_developerportal_shell_createproject2(inputs)
});
export { developerportal_shell_createproject2 as "developerPortal.shell.createProject" }