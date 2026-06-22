/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Recentlycreated2Inputs */

const en_developerportal_shell_recentlycreated2 = /** @type {(inputs: Developerportal_Shell_Recentlycreated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recently created`)
};

const es_developerportal_shell_recentlycreated2 = /** @type {(inputs: Developerportal_Shell_Recentlycreated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creado recientemente`)
};

const fr_developerportal_shell_recentlycreated2 = /** @type {(inputs: Developerportal_Shell_Recentlycreated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créé récemment`)
};

const ar_developerportal_shell_recentlycreated2 = /** @type {(inputs: Developerportal_Shell_Recentlycreated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ مؤخراً`)
};

/**
* | output |
* | --- |
* | "Recently created" |
*
* @param {Developerportal_Shell_Recentlycreated2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_recentlycreated2 = /** @type {((inputs?: Developerportal_Shell_Recentlycreated2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Recentlycreated2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_recentlycreated2(inputs)
	if (locale === "es") return es_developerportal_shell_recentlycreated2(inputs)
	if (locale === "fr") return fr_developerportal_shell_recentlycreated2(inputs)
	return ar_developerportal_shell_recentlycreated2(inputs)
});
export { developerportal_shell_recentlycreated2 as "developerPortal.shell.recentlyCreated" }