/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Opendashboard2Inputs */

const en_developerportal_shell_opendashboard2 = /** @type {(inputs: Developerportal_Shell_Opendashboard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open Dashboard`)
};

const es_developerportal_shell_opendashboard2 = /** @type {(inputs: Developerportal_Shell_Opendashboard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir Panel`)
};

const fr_developerportal_shell_opendashboard2 = /** @type {(inputs: Developerportal_Shell_Opendashboard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir le Tableau de Bord`)
};

const ar_developerportal_shell_opendashboard2 = /** @type {(inputs: Developerportal_Shell_Opendashboard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح لوحة التحكم`)
};

/**
* | output |
* | --- |
* | "Open Dashboard" |
*
* @param {Developerportal_Shell_Opendashboard2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_opendashboard2 = /** @type {((inputs?: Developerportal_Shell_Opendashboard2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Opendashboard2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_opendashboard2(inputs)
	if (locale === "es") return es_developerportal_shell_opendashboard2(inputs)
	if (locale === "fr") return fr_developerportal_shell_opendashboard2(inputs)
	return ar_developerportal_shell_opendashboard2(inputs)
});
export { developerportal_shell_opendashboard2 as "developerPortal.shell.openDashboard" }