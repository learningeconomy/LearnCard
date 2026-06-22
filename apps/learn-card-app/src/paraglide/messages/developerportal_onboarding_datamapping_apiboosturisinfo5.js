/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Apiboosturisinfo5Inputs */

const en_developerportal_onboarding_datamapping_apiboosturisinfo5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiboosturisinfo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Boost Template URIs`)
};

const es_developerportal_onboarding_datamapping_apiboosturisinfo5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiboosturisinfo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tus URIs de Plantillas Boost`)
};

const fr_developerportal_onboarding_datamapping_apiboosturisinfo5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiboosturisinfo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vos URI de Modèles Boost`)
};

const ar_developerportal_onboarding_datamapping_apiboosturisinfo5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiboosturisinfo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URIs قوالب المعززات الخاصة بك`)
};

/**
* | output |
* | --- |
* | "Your Boost Template URIs" |
*
* @param {Developerportal_Onboarding_Datamapping_Apiboosturisinfo5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_apiboosturisinfo5 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Apiboosturisinfo5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Apiboosturisinfo5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_apiboosturisinfo5(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_apiboosturisinfo5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_apiboosturisinfo5(inputs)
	return ar_developerportal_onboarding_datamapping_apiboosturisinfo5(inputs)
});
export { developerportal_onboarding_datamapping_apiboosturisinfo5 as "developerPortal.onboarding.dataMapping.apiBoostUrisInfo" }