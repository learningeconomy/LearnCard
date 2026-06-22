/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Csvuploadbutton4Inputs */

const en_developerportal_onboarding_datamapping_csvuploadbutton4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvuploadbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload CSV`)
};

const es_developerportal_onboarding_datamapping_csvuploadbutton4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvuploadbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir CSV`)
};

const fr_developerportal_onboarding_datamapping_csvuploadbutton4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvuploadbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger CSV`)
};

const ar_developerportal_onboarding_datamapping_csvuploadbutton4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvuploadbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفع CSV`)
};

/**
* | output |
* | --- |
* | "Upload CSV" |
*
* @param {Developerportal_Onboarding_Datamapping_Csvuploadbutton4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_csvuploadbutton4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Csvuploadbutton4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Csvuploadbutton4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_csvuploadbutton4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_csvuploadbutton4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_csvuploadbutton4(inputs)
	return ar_developerportal_onboarding_datamapping_csvuploadbutton4(inputs)
});
export { developerportal_onboarding_datamapping_csvuploadbutton4 as "developerPortal.onboarding.dataMapping.csvUploadButton" }