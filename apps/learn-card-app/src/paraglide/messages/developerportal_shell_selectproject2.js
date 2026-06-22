/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Selectproject2Inputs */

const en_developerportal_shell_selectproject2 = /** @type {(inputs: Developerportal_Shell_Selectproject2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a project to manage its app listings`)
};

const es_developerportal_shell_selectproject2 = /** @type {(inputs: Developerportal_Shell_Selectproject2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona un proyecto para gestionar sus listados de apps`)
};

const fr_developerportal_shell_selectproject2 = /** @type {(inputs: Developerportal_Shell_Selectproject2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez un projet pour gérer ses fiches d'application`)
};

const ar_developerportal_shell_selectproject2 = /** @type {(inputs: Developerportal_Shell_Selectproject2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر مشروعاً لإدارة قوائم تطبيقاته`)
};

/**
* | output |
* | --- |
* | "Select a project to manage its app listings" |
*
* @param {Developerportal_Shell_Selectproject2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_selectproject2 = /** @type {((inputs?: Developerportal_Shell_Selectproject2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Selectproject2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_selectproject2(inputs)
	if (locale === "es") return es_developerportal_shell_selectproject2(inputs)
	if (locale === "fr") return fr_developerportal_shell_selectproject2(inputs)
	return ar_developerportal_shell_selectproject2(inputs)
});
export { developerportal_shell_selectproject2 as "developerPortal.shell.selectProject" }