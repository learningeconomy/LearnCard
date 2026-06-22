/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Nameyourproject3Inputs */

const en_developerportal_shell_nameyourproject3 = /** @type {(inputs: Developerportal_Shell_Nameyourproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name your first project`)
};

const es_developerportal_shell_nameyourproject3 = /** @type {(inputs: Developerportal_Shell_Nameyourproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombra tu primer proyecto`)
};

const fr_developerportal_shell_nameyourproject3 = /** @type {(inputs: Developerportal_Shell_Nameyourproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nommez votre premier projet`)
};

const ar_developerportal_shell_nameyourproject3 = /** @type {(inputs: Developerportal_Shell_Nameyourproject3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سمِّ مشروعك الأول`)
};

/**
* | output |
* | --- |
* | "Name your first project" |
*
* @param {Developerportal_Shell_Nameyourproject3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_nameyourproject3 = /** @type {((inputs?: Developerportal_Shell_Nameyourproject3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Nameyourproject3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_nameyourproject3(inputs)
	if (locale === "es") return es_developerportal_shell_nameyourproject3(inputs)
	if (locale === "fr") return fr_developerportal_shell_nameyourproject3(inputs)
	return ar_developerportal_shell_nameyourproject3(inputs)
});
export { developerportal_shell_nameyourproject3 as "developerPortal.shell.nameYourProject" }