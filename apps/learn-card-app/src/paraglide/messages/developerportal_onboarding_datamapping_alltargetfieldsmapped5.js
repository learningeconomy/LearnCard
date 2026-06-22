/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Alltargetfieldsmapped5Inputs */

const en_developerportal_onboarding_datamapping_alltargetfieldsmapped5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Alltargetfieldsmapped5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All target fields mapped`)
};

const es_developerportal_onboarding_datamapping_alltargetfieldsmapped5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Alltargetfieldsmapped5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All target fields mapped`)
};

const fr_developerportal_onboarding_datamapping_alltargetfieldsmapped5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Alltargetfieldsmapped5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All target fields mapped`)
};

const ar_developerportal_onboarding_datamapping_alltargetfieldsmapped5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Alltargetfieldsmapped5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All target fields mapped`)
};

/**
* | output |
* | --- |
* | "All target fields mapped" |
*
* @param {Developerportal_Onboarding_Datamapping_Alltargetfieldsmapped5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_alltargetfieldsmapped5 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Alltargetfieldsmapped5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Alltargetfieldsmapped5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_alltargetfieldsmapped5(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_alltargetfieldsmapped5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_alltargetfieldsmapped5(inputs)
	return ar_developerportal_onboarding_datamapping_alltargetfieldsmapped5(inputs)
});
export { developerportal_onboarding_datamapping_alltargetfieldsmapped5 as "developerPortal.onboarding.dataMapping.allTargetFieldsMapped" }