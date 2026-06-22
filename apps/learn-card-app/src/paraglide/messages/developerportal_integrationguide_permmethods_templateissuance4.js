/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Permmethods_Templateissuance4Inputs */

const en_developerportal_integrationguide_permmethods_templateissuance4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Templateissuance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue from template/boost`)
};

const es_developerportal_integrationguide_permmethods_templateissuance4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Templateissuance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir desde plantilla/boost`)
};

const fr_developerportal_integrationguide_permmethods_templateissuance4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Templateissuance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre depuis un modèle/boost`)
};

const ar_developerportal_integrationguide_permmethods_templateissuance4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Templateissuance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإصدار من قالب/تعزيز`)
};

/**
* | output |
* | --- |
* | "Issue from template/boost" |
*
* @param {Developerportal_Integrationguide_Permmethods_Templateissuance4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_permmethods_templateissuance4 = /** @type {((inputs?: Developerportal_Integrationguide_Permmethods_Templateissuance4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Permmethods_Templateissuance4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_permmethods_templateissuance4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_permmethods_templateissuance4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_permmethods_templateissuance4(inputs)
	return ar_developerportal_integrationguide_permmethods_templateissuance4(inputs)
});
export { developerportal_integrationguide_permmethods_templateissuance4 as "developerPortal.integrationGuide.permMethods.templateIssuance" }