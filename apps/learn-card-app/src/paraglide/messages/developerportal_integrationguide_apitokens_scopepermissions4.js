/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Apitokens_Scopepermissions4Inputs */

const en_developerportal_integrationguide_apitokens_scopepermissions4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Scopepermissions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scope / Permissions`)
};

const es_developerportal_integrationguide_apitokens_scopepermissions4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Scopepermissions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alcance / Permisos`)
};

const fr_developerportal_integrationguide_apitokens_scopepermissions4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Scopepermissions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portée / Permissions`)
};

const ar_developerportal_integrationguide_apitokens_scopepermissions4 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Scopepermissions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النطاق / الصلاحيات`)
};

/**
* | output |
* | --- |
* | "Scope / Permissions" |
*
* @param {Developerportal_Integrationguide_Apitokens_Scopepermissions4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_apitokens_scopepermissions4 = /** @type {((inputs?: Developerportal_Integrationguide_Apitokens_Scopepermissions4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Apitokens_Scopepermissions4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_apitokens_scopepermissions4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_apitokens_scopepermissions4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_apitokens_scopepermissions4(inputs)
	return ar_developerportal_integrationguide_apitokens_scopepermissions4(inputs)
});
export { developerportal_integrationguide_apitokens_scopepermissions4 as "developerPortal.integrationGuide.apiTokens.scopePermissions" }