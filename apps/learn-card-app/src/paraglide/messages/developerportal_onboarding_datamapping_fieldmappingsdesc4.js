/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Fieldmappingsdesc4Inputs */

const en_developerportal_onboarding_datamapping_fieldmappingsdesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Fieldmappingsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Map fields from your payload to credential template variables.`)
};

const es_developerportal_onboarding_datamapping_fieldmappingsdesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Fieldmappingsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mapea los campos de tu carga útil a las variables de la plantilla de credencial.`)
};

const fr_developerportal_onboarding_datamapping_fieldmappingsdesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Fieldmappingsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mappez les champs de votre payload aux variables du modèle de credential.`)
};

const ar_developerportal_onboarding_datamapping_fieldmappingsdesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Fieldmappingsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتخطيط الحقول من حمولتك إلى متغيرات قالب بيانات الاعتماد.`)
};

/**
* | output |
* | --- |
* | "Map fields from your payload to credential template variables." |
*
* @param {Developerportal_Onboarding_Datamapping_Fieldmappingsdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_fieldmappingsdesc4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Fieldmappingsdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Fieldmappingsdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_fieldmappingsdesc4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_fieldmappingsdesc4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_fieldmappingsdesc4(inputs)
	return ar_developerportal_onboarding_datamapping_fieldmappingsdesc4(inputs)
});
export { developerportal_onboarding_datamapping_fieldmappingsdesc4 as "developerPortal.onboarding.dataMapping.fieldMappingsDesc" }