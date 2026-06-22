/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Freetopublish3Inputs */

const en_developerportal_shell_freetopublish3 = /** @type {(inputs: Developerportal_Shell_Freetopublish3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Free to publish • No coding required`)
};

const es_developerportal_shell_freetopublish3 = /** @type {(inputs: Developerportal_Shell_Freetopublish3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gratis para publicar • Sin necesidad de codificar`)
};

const fr_developerportal_shell_freetopublish3 = /** @type {(inputs: Developerportal_Shell_Freetopublish3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gratuit à publier • Aucun codage requis`)
};

const ar_developerportal_shell_freetopublish3 = /** @type {(inputs: Developerportal_Shell_Freetopublish3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النشر مجاني • لا حاجة للبرمجة`)
};

/**
* | output |
* | --- |
* | "Free to publish • No coding required" |
*
* @param {Developerportal_Shell_Freetopublish3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_freetopublish3 = /** @type {((inputs?: Developerportal_Shell_Freetopublish3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Freetopublish3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_freetopublish3(inputs)
	if (locale === "es") return es_developerportal_shell_freetopublish3(inputs)
	if (locale === "fr") return fr_developerportal_shell_freetopublish3(inputs)
	return ar_developerportal_shell_freetopublish3(inputs)
});
export { developerportal_shell_freetopublish3 as "developerPortal.shell.freeToPublish" }