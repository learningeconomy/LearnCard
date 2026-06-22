/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Featuretemplatedownload4Inputs */

const en_developerportal_onboarding_integrationmethod_featuretemplatedownload4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featuretemplatedownload4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Template download available`)
};

const es_developerportal_onboarding_integrationmethod_featuretemplatedownload4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featuretemplatedownload4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descarga de plantilla disponible`)
};

const fr_developerportal_onboarding_integrationmethod_featuretemplatedownload4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featuretemplatedownload4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargement de modèle disponible`)
};

const ar_developerportal_onboarding_integrationmethod_featuretemplatedownload4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featuretemplatedownload4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنزيل القالب متاح`)
};

/**
* | output |
* | --- |
* | "Template download available" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Featuretemplatedownload4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_featuretemplatedownload4 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Featuretemplatedownload4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Featuretemplatedownload4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_featuretemplatedownload4(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_featuretemplatedownload4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_featuretemplatedownload4(inputs)
	return ar_developerportal_onboarding_integrationmethod_featuretemplatedownload4(inputs)
});
export { developerportal_onboarding_integrationmethod_featuretemplatedownload4 as "developerPortal.onboarding.integrationMethod.featureTemplateDownload" }