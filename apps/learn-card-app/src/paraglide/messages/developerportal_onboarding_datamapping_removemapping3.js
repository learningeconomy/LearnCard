/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Removemapping3Inputs */

const en_developerportal_onboarding_datamapping_removemapping3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Removemapping3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove`)
};

const es_developerportal_onboarding_datamapping_removemapping3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Removemapping3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const fr_developerportal_onboarding_datamapping_removemapping3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Removemapping3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer`)
};

const ar_developerportal_onboarding_datamapping_removemapping3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Removemapping3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إزالة`)
};

/**
* | output |
* | --- |
* | "Remove" |
*
* @param {Developerportal_Onboarding_Datamapping_Removemapping3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_removemapping3 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Removemapping3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Removemapping3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_removemapping3(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_removemapping3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_removemapping3(inputs)
	return ar_developerportal_onboarding_datamapping_removemapping3(inputs)
});
export { developerportal_onboarding_datamapping_removemapping3 as "developerPortal.onboarding.dataMapping.removeMapping" }