/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Betatitle2Inputs */

const en_developerportal_shell_betatitle2 = /** @type {(inputs: Developerportal_Shell_Betatitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Developer Portal Beta`)
};

const es_developerportal_shell_betatitle2 = /** @type {(inputs: Developerportal_Shell_Betatitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portal de Desarrolladores Beta`)
};

const fr_developerportal_shell_betatitle2 = /** @type {(inputs: Developerportal_Shell_Betatitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portail Développeur Bêta`)
};

const ar_developerportal_shell_betatitle2 = /** @type {(inputs: Developerportal_Shell_Betatitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بوابة المطورين بيتا`)
};

/**
* | output |
* | --- |
* | "Developer Portal Beta" |
*
* @param {Developerportal_Shell_Betatitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_betatitle2 = /** @type {((inputs?: Developerportal_Shell_Betatitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Betatitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_betatitle2(inputs)
	if (locale === "es") return es_developerportal_shell_betatitle2(inputs)
	if (locale === "fr") return fr_developerportal_shell_betatitle2(inputs)
	return ar_developerportal_shell_betatitle2(inputs)
});
export { developerportal_shell_betatitle2 as "developerPortal.shell.betaTitle" }