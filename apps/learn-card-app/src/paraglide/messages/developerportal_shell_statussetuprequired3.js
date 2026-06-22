/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Statussetuprequired3Inputs */

const en_developerportal_shell_statussetuprequired3 = /** @type {(inputs: Developerportal_Shell_Statussetuprequired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Setup Required`)
};

const es_developerportal_shell_statussetuprequired3 = /** @type {(inputs: Developerportal_Shell_Statussetuprequired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración Requerida`)
};

const fr_developerportal_shell_statussetuprequired3 = /** @type {(inputs: Developerportal_Shell_Statussetuprequired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration Requise`)
};

const ar_developerportal_shell_statussetuprequired3 = /** @type {(inputs: Developerportal_Shell_Statussetuprequired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإعداد مطلوب`)
};

/**
* | output |
* | --- |
* | "Setup Required" |
*
* @param {Developerportal_Shell_Statussetuprequired3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_statussetuprequired3 = /** @type {((inputs?: Developerportal_Shell_Statussetuprequired3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Statussetuprequired3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_statussetuprequired3(inputs)
	if (locale === "es") return es_developerportal_shell_statussetuprequired3(inputs)
	if (locale === "fr") return fr_developerportal_shell_statussetuprequired3(inputs)
	return ar_developerportal_shell_statussetuprequired3(inputs)
});
export { developerportal_shell_statussetuprequired3 as "developerPortal.shell.statusSetupRequired" }