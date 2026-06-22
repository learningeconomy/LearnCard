/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Fieldmappings3Inputs */

const en_developerportal_onboarding_datamapping_fieldmappings3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Fieldmappings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Field Mappings`)
};

const es_developerportal_onboarding_datamapping_fieldmappings3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Fieldmappings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mapeo de Campos`)
};

const fr_developerportal_onboarding_datamapping_fieldmappings3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Fieldmappings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mappings de Champs`)
};

const ar_developerportal_onboarding_datamapping_fieldmappings3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Fieldmappings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخطيطات الحقول`)
};

/**
* | output |
* | --- |
* | "Field Mappings" |
*
* @param {Developerportal_Onboarding_Datamapping_Fieldmappings3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_fieldmappings3 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Fieldmappings3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Fieldmappings3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_fieldmappings3(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_fieldmappings3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_fieldmappings3(inputs)
	return ar_developerportal_onboarding_datamapping_fieldmappings3(inputs)
});
export { developerportal_onboarding_datamapping_fieldmappings3 as "developerPortal.onboarding.dataMapping.fieldMappings" }