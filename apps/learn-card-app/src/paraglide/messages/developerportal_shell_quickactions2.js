/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Quickactions2Inputs */

const en_developerportal_shell_quickactions2 = /** @type {(inputs: Developerportal_Shell_Quickactions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quick Actions`)
};

const es_developerportal_shell_quickactions2 = /** @type {(inputs: Developerportal_Shell_Quickactions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acciones Rápidas`)
};

const fr_developerportal_shell_quickactions2 = /** @type {(inputs: Developerportal_Shell_Quickactions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actions Rapides`)
};

const ar_developerportal_shell_quickactions2 = /** @type {(inputs: Developerportal_Shell_Quickactions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إجراءات سريعة`)
};

/**
* | output |
* | --- |
* | "Quick Actions" |
*
* @param {Developerportal_Shell_Quickactions2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_quickactions2 = /** @type {((inputs?: Developerportal_Shell_Quickactions2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Quickactions2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_quickactions2(inputs)
	if (locale === "es") return es_developerportal_shell_quickactions2(inputs)
	if (locale === "fr") return fr_developerportal_shell_quickactions2(inputs)
	return ar_developerportal_shell_quickactions2(inputs)
});
export { developerportal_shell_quickactions2 as "developerPortal.shell.quickActions" }