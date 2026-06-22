/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Betabadge2Inputs */

const en_developerportal_shell_betabadge2 = /** @type {(inputs: Developerportal_Shell_Betabadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beta`)
};

const es_developerportal_shell_betabadge2 = /** @type {(inputs: Developerportal_Shell_Betabadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beta`)
};

const fr_developerportal_shell_betabadge2 = /** @type {(inputs: Developerportal_Shell_Betabadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bêta`)
};

const ar_developerportal_shell_betabadge2 = /** @type {(inputs: Developerportal_Shell_Betabadge2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بيتا`)
};

/**
* | output |
* | --- |
* | "Beta" |
*
* @param {Developerportal_Shell_Betabadge2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_betabadge2 = /** @type {((inputs?: Developerportal_Shell_Betabadge2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Betabadge2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_betabadge2(inputs)
	if (locale === "es") return es_developerportal_shell_betabadge2(inputs)
	if (locale === "fr") return fr_developerportal_shell_betabadge2(inputs)
	return ar_developerportal_shell_betabadge2(inputs)
});
export { developerportal_shell_betabadge2 as "developerPortal.shell.betaBadge" }