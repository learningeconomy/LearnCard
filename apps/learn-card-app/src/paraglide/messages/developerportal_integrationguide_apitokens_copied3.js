/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Apitokens_Copied3Inputs */

const en_developerportal_integrationguide_apitokens_copied3 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Copied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API Token copied to clipboard`)
};

const es_developerportal_integrationguide_apitokens_copied3 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Copied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token de API copiado al portapapeles`)
};

const fr_developerportal_integrationguide_apitokens_copied3 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Copied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Jeton d'API copié dans le presse-papiers`)
};

const ar_developerportal_integrationguide_apitokens_copied3 = /** @type {(inputs: Developerportal_Integrationguide_Apitokens_Copied3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ رمز API إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "API Token copied to clipboard" |
*
* @param {Developerportal_Integrationguide_Apitokens_Copied3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_apitokens_copied3 = /** @type {((inputs?: Developerportal_Integrationguide_Apitokens_Copied3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Apitokens_Copied3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_apitokens_copied3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_apitokens_copied3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_apitokens_copied3(inputs)
	return ar_developerportal_integrationguide_apitokens_copied3(inputs)
});
export { developerportal_integrationguide_apitokens_copied3 as "developerPortal.integrationGuide.apiTokens.copied" }