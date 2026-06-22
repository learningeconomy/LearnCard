/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Templatebuilder_Dynamicfields3Inputs */

const en_developerportal_onboarding_templatebuilder_dynamicfields3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Dynamicfields3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} dynamic fields`)
};

const es_developerportal_onboarding_templatebuilder_dynamicfields3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Dynamicfields3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} campos dinámicos`)
};

const fr_developerportal_onboarding_templatebuilder_dynamicfields3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Dynamicfields3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} champs dynamiques`)
};

const ar_developerportal_onboarding_templatebuilder_dynamicfields3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Dynamicfields3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} حقول ديناميكية`)
};

/**
* | output |
* | --- |
* | "{count} dynamic fields" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Dynamicfields3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_dynamicfields3 = /** @type {((inputs: Developerportal_Onboarding_Templatebuilder_Dynamicfields3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Dynamicfields3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_dynamicfields3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_dynamicfields3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_dynamicfields3(inputs)
	return ar_developerportal_onboarding_templatebuilder_dynamicfields3(inputs)
});
export { developerportal_onboarding_templatebuilder_dynamicfields3 as "developerPortal.onboarding.templateBuilder.dynamicFields" }