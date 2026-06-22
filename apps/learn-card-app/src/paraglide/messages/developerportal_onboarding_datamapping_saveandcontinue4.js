/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Saveandcontinue4Inputs */

const en_developerportal_onboarding_datamapping_saveandcontinue4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Saveandcontinue4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save & Continue`)
};

const es_developerportal_onboarding_datamapping_saveandcontinue4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Saveandcontinue4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar y Continuar`)
};

const fr_developerportal_onboarding_datamapping_saveandcontinue4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Saveandcontinue4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer et Continuer`)
};

const ar_developerportal_onboarding_datamapping_saveandcontinue4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Saveandcontinue4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ ومتابعة`)
};

/**
* | output |
* | --- |
* | "Save & Continue" |
*
* @param {Developerportal_Onboarding_Datamapping_Saveandcontinue4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_saveandcontinue4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Saveandcontinue4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Saveandcontinue4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_saveandcontinue4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_saveandcontinue4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_saveandcontinue4(inputs)
	return ar_developerportal_onboarding_datamapping_saveandcontinue4(inputs)
});
export { developerportal_onboarding_datamapping_saveandcontinue4 as "developerPortal.onboarding.dataMapping.saveAndContinue" }