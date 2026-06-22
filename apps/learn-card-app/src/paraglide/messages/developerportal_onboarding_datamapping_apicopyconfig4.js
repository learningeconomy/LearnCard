/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Datamapping_Apicopyconfig4Inputs */

const en_developerportal_onboarding_datamapping_apicopyconfig4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apicopyconfig4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Copy All as Config (${i?.count} templates)`)
};

const es_developerportal_onboarding_datamapping_apicopyconfig4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apicopyconfig4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Copiar Todo como Configuración (${i?.count} plantillas)`)
};

const fr_developerportal_onboarding_datamapping_apicopyconfig4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apicopyconfig4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Tout Copier comme Config (${i?.count} modèles)`)
};

const ar_developerportal_onboarding_datamapping_apicopyconfig4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apicopyconfig4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`نسخ الكل كتكوين (${i?.count} قالب)`)
};

/**
* | output |
* | --- |
* | "Copy All as Config ({count} templates)" |
*
* @param {Developerportal_Onboarding_Datamapping_Apicopyconfig4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_apicopyconfig4 = /** @type {((inputs: Developerportal_Onboarding_Datamapping_Apicopyconfig4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Apicopyconfig4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_apicopyconfig4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_apicopyconfig4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_apicopyconfig4(inputs)
	return ar_developerportal_onboarding_datamapping_apicopyconfig4(inputs)
});
export { developerportal_onboarding_datamapping_apicopyconfig4 as "developerPortal.onboarding.dataMapping.apiCopyConfig" }