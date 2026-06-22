/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Integrationnotfoundsimple4Inputs */

const en_developerportal_shell_integrationnotfoundsimple4 = /** @type {(inputs: Developerportal_Shell_Integrationnotfoundsimple4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration not found`)
};

const es_developerportal_shell_integrationnotfoundsimple4 = /** @type {(inputs: Developerportal_Shell_Integrationnotfoundsimple4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integración no encontrada`)
};

const fr_developerportal_shell_integrationnotfoundsimple4 = /** @type {(inputs: Developerportal_Shell_Integrationnotfoundsimple4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intégration introuvable`)
};

const ar_developerportal_shell_integrationnotfoundsimple4 = /** @type {(inputs: Developerportal_Shell_Integrationnotfoundsimple4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التكامل غير موجود`)
};

/**
* | output |
* | --- |
* | "Integration not found" |
*
* @param {Developerportal_Shell_Integrationnotfoundsimple4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_integrationnotfoundsimple4 = /** @type {((inputs?: Developerportal_Shell_Integrationnotfoundsimple4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Integrationnotfoundsimple4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_integrationnotfoundsimple4(inputs)
	if (locale === "es") return es_developerportal_shell_integrationnotfoundsimple4(inputs)
	if (locale === "fr") return fr_developerportal_shell_integrationnotfoundsimple4(inputs)
	return ar_developerportal_shell_integrationnotfoundsimple4(inputs)
});
export { developerportal_shell_integrationnotfoundsimple4 as "developerPortal.shell.integrationNotFoundSimple" }