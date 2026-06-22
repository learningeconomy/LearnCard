/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Generatedtemplatedata4Inputs */

const en_developerportal_onboarding_datamapping_generatedtemplatedata4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Generatedtemplatedata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generated templateData`)
};

const es_developerportal_onboarding_datamapping_generatedtemplatedata4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Generatedtemplatedata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generated templateData`)
};

const fr_developerportal_onboarding_datamapping_generatedtemplatedata4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Generatedtemplatedata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generated templateData`)
};

const ar_developerportal_onboarding_datamapping_generatedtemplatedata4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Generatedtemplatedata4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generated templateData`)
};

/**
* | output |
* | --- |
* | "Generated templateData" |
*
* @param {Developerportal_Onboarding_Datamapping_Generatedtemplatedata4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_generatedtemplatedata4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Generatedtemplatedata4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Generatedtemplatedata4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_generatedtemplatedata4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_generatedtemplatedata4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_generatedtemplatedata4(inputs)
	return ar_developerportal_onboarding_datamapping_generatedtemplatedata4(inputs)
});
export { developerportal_onboarding_datamapping_generatedtemplatedata4 as "developerPortal.onboarding.dataMapping.generatedTemplateData" }