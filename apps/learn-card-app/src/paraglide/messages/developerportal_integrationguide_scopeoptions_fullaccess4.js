/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Scopeoptions_Fullaccess4Inputs */

const en_developerportal_integrationguide_scopeoptions_fullaccess4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Fullaccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Access`)
};

const es_developerportal_integrationguide_scopeoptions_fullaccess4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Fullaccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceso Completo`)
};

const fr_developerportal_integrationguide_scopeoptions_fullaccess4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Fullaccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accès Complet`)
};

const ar_developerportal_integrationguide_scopeoptions_fullaccess4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Fullaccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصول كامل`)
};

/**
* | output |
* | --- |
* | "Full Access" |
*
* @param {Developerportal_Integrationguide_Scopeoptions_Fullaccess4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_scopeoptions_fullaccess4 = /** @type {((inputs?: Developerportal_Integrationguide_Scopeoptions_Fullaccess4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Scopeoptions_Fullaccess4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_scopeoptions_fullaccess4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_scopeoptions_fullaccess4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_scopeoptions_fullaccess4(inputs)
	return ar_developerportal_integrationguide_scopeoptions_fullaccess4(inputs)
});
export { developerportal_integrationguide_scopeoptions_fullaccess4 as "developerPortal.integrationGuide.scopeOptions.fullAccess" }