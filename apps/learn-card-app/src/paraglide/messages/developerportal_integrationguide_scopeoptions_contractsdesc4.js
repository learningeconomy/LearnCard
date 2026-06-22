/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Scopeoptions_Contractsdesc4Inputs */

const en_developerportal_integrationguide_scopeoptions_contractsdesc4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Contractsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage contracts`)
};

const es_developerportal_integrationguide_scopeoptions_contractsdesc4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Contractsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar contratos`)
};

const fr_developerportal_integrationguide_scopeoptions_contractsdesc4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Contractsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les contrats`)
};

const ar_developerportal_integrationguide_scopeoptions_contractsdesc4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Contractsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة العقود`)
};

/**
* | output |
* | --- |
* | "Manage contracts" |
*
* @param {Developerportal_Integrationguide_Scopeoptions_Contractsdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_scopeoptions_contractsdesc4 = /** @type {((inputs?: Developerportal_Integrationguide_Scopeoptions_Contractsdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Scopeoptions_Contractsdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_scopeoptions_contractsdesc4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_scopeoptions_contractsdesc4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_scopeoptions_contractsdesc4(inputs)
	return ar_developerportal_integrationguide_scopeoptions_contractsdesc4(inputs)
});
export { developerportal_integrationguide_scopeoptions_contractsdesc4 as "developerPortal.integrationGuide.scopeOptions.contractsDesc" }