/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Runcodetitle4Inputs */

const en_developerportal_onboarding_datamapping_runcodetitle4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Runcodetitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Run Your Code`)
};

const es_developerportal_onboarding_datamapping_runcodetitle4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Runcodetitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ejecuta tu Código`)
};

const fr_developerportal_onboarding_datamapping_runcodetitle4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Runcodetitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exécutez votre Code`)
};

const ar_developerportal_onboarding_datamapping_runcodetitle4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Runcodetitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تشغيل الكود الخاص بك`)
};

/**
* | output |
* | --- |
* | "Run Your Code" |
*
* @param {Developerportal_Onboarding_Datamapping_Runcodetitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_runcodetitle4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Runcodetitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Runcodetitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_runcodetitle4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_runcodetitle4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_runcodetitle4(inputs)
	return ar_developerportal_onboarding_datamapping_runcodetitle4(inputs)
});
export { developerportal_onboarding_datamapping_runcodetitle4 as "developerPortal.onboarding.dataMapping.runCodeTitle" }