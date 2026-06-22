/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Apitokens_Deleted3Inputs */

const en_developerportal_integrationguide_apitokens_deleted3 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Deleted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API Token deleted`)
};

const es_developerportal_integrationguide_apitokens_deleted3 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Deleted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token de API eliminado`)
};

const fr_developerportal_integrationguide_apitokens_deleted3 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Deleted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Jeton d'API supprimé`)
};

const ar_developerportal_integrationguide_apitokens_deleted3 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Deleted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حذف رمز API`)
};

/**
* | output |
* | --- |
* | "API Token deleted" |
*
* @param {Developerportal_Integrationguide_Apitokens_Deleted3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_apitokens_deleted3 = /** @type {((inputs?: Developerportal_Integrationguide_Apitokens_Deleted3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Apitokens_Deleted3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_apitokens_deleted3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_apitokens_deleted3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_apitokens_deleted3(inputs)
	return ar_developerportal_integrationguide_apitokens_deleted3(inputs)
});
export { developerportal_integrationguide_apitokens_deleted3 as "developerPortal.integrationGuide.apiTokens.deleted" }