/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Publishyourapp3Inputs */

const en_developerportal_shell_publishyourapp3 = /** @type {(inputs: Developerportal_Shell_Publishyourapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publish Your App`)
};

const es_developerportal_shell_publishyourapp3 = /** @type {(inputs: Developerportal_Shell_Publishyourapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publica tu App`)
};

const fr_developerportal_shell_publishyourapp3 = /** @type {(inputs: Developerportal_Shell_Publishyourapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publiez votre Application`)
};

const ar_developerportal_shell_publishyourapp3 = /** @type {(inputs: Developerportal_Shell_Publishyourapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انشر تطبيقك`)
};

/**
* | output |
* | --- |
* | "Publish Your App" |
*
* @param {Developerportal_Shell_Publishyourapp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_publishyourapp3 = /** @type {((inputs?: Developerportal_Shell_Publishyourapp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Publishyourapp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_publishyourapp3(inputs)
	if (locale === "es") return es_developerportal_shell_publishyourapp3(inputs)
	if (locale === "fr") return fr_developerportal_shell_publishyourapp3(inputs)
	return ar_developerportal_shell_publishyourapp3(inputs)
});
export { developerportal_shell_publishyourapp3 as "developerPortal.shell.publishYourApp" }