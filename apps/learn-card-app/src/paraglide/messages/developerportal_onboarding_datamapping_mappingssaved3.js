/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Mappingssaved3Inputs */

const en_developerportal_onboarding_datamapping_mappingssaved3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Mappingssaved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Field mappings saved!`)
};

const es_developerportal_onboarding_datamapping_mappingssaved3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Mappingssaved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Mapeos de campos guardados!`)
};

const fr_developerportal_onboarding_datamapping_mappingssaved3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Mappingssaved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mappings de champs enregistrés !`)
};

const ar_developerportal_onboarding_datamapping_mappingssaved3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Mappingssaved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حفظ تخطيطات الحقول!`)
};

/**
* | output |
* | --- |
* | "Field mappings saved!" |
*
* @param {Developerportal_Onboarding_Datamapping_Mappingssaved3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_mappingssaved3 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Mappingssaved3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Mappingssaved3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_mappingssaved3(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_mappingssaved3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_mappingssaved3(inputs)
	return ar_developerportal_onboarding_datamapping_mappingssaved3(inputs)
});
export { developerportal_onboarding_datamapping_mappingssaved3 as "developerPortal.onboarding.dataMapping.mappingsSaved" }