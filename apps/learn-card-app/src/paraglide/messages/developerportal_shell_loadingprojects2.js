/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Loadingprojects2Inputs */

const en_developerportal_shell_loadingprojects2 = /** @type {(inputs: Developerportal_Shell_Loadingprojects2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading projects...`)
};

const es_developerportal_shell_loadingprojects2 = /** @type {(inputs: Developerportal_Shell_Loadingprojects2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando proyectos...`)
};

const fr_developerportal_shell_loadingprojects2 = /** @type {(inputs: Developerportal_Shell_Loadingprojects2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des projets...`)
};

const ar_developerportal_shell_loadingprojects2 = /** @type {(inputs: Developerportal_Shell_Loadingprojects2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل المشاريع...`)
};

/**
* | output |
* | --- |
* | "Loading projects..." |
*
* @param {Developerportal_Shell_Loadingprojects2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_loadingprojects2 = /** @type {((inputs?: Developerportal_Shell_Loadingprojects2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Loadingprojects2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_loadingprojects2(inputs)
	if (locale === "es") return es_developerportal_shell_loadingprojects2(inputs)
	if (locale === "fr") return fr_developerportal_shell_loadingprojects2(inputs)
	return ar_developerportal_shell_loadingprojects2(inputs)
});
export { developerportal_shell_loadingprojects2 as "developerPortal.shell.loadingProjects" }