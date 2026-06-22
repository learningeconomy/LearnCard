/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Noguideselected3Inputs */

const en_developerportal_shell_noguideselected3 = /** @type {(inputs: Developerportal_Shell_Noguideselected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No guide selected`)
};

const es_developerportal_shell_noguideselected3 = /** @type {(inputs: Developerportal_Shell_Noguideselected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ninguna guía seleccionada`)
};

const fr_developerportal_shell_noguideselected3 = /** @type {(inputs: Developerportal_Shell_Noguideselected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun guide sélectionné`)
};

const ar_developerportal_shell_noguideselected3 = /** @type {(inputs: Developerportal_Shell_Noguideselected3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم اختيار دليل`)
};

/**
* | output |
* | --- |
* | "No guide selected" |
*
* @param {Developerportal_Shell_Noguideselected3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_noguideselected3 = /** @type {((inputs?: Developerportal_Shell_Noguideselected3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Noguideselected3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_noguideselected3(inputs)
	if (locale === "es") return es_developerportal_shell_noguideselected3(inputs)
	if (locale === "fr") return fr_developerportal_shell_noguideselected3(inputs)
	return ar_developerportal_shell_noguideselected3(inputs)
});
export { developerportal_shell_noguideselected3 as "developerPortal.shell.noGuideSelected" }