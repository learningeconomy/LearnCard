/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Betadescription2Inputs */

const en_developerportal_shell_betadescription2 = /** @type {(inputs: Developerportal_Shell_Betadescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Early access — features may change`)
};

const es_developerportal_shell_betadescription2 = /** @type {(inputs: Developerportal_Shell_Betadescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceso anticipado — las funciones pueden cambiar`)
};

const fr_developerportal_shell_betadescription2 = /** @type {(inputs: Developerportal_Shell_Betadescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accès anticipé — les fonctionnalités peuvent changer`)
};

const ar_developerportal_shell_betadescription2 = /** @type {(inputs: Developerportal_Shell_Betadescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصول مبكر — الميزات قابلة للتغيير`)
};

/**
* | output |
* | --- |
* | "Early access — features may change" |
*
* @param {Developerportal_Shell_Betadescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_betadescription2 = /** @type {((inputs?: Developerportal_Shell_Betadescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Betadescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_betadescription2(inputs)
	if (locale === "es") return es_developerportal_shell_betadescription2(inputs)
	if (locale === "fr") return fr_developerportal_shell_betadescription2(inputs)
	return ar_developerportal_shell_betadescription2(inputs)
});
export { developerportal_shell_betadescription2 as "developerPortal.shell.betaDescription" }