/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Csvdownloadtemplate4Inputs */

const en_developerportal_onboarding_datamapping_csvdownloadtemplate4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvdownloadtemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download CSV Template`)
};

const es_developerportal_onboarding_datamapping_csvdownloadtemplate4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvdownloadtemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descargar Plantilla CSV`)
};

const fr_developerportal_onboarding_datamapping_csvdownloadtemplate4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvdownloadtemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger le Modèle CSV`)
};

const ar_developerportal_onboarding_datamapping_csvdownloadtemplate4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Csvdownloadtemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنزيل قالب CSV`)
};

/**
* | output |
* | --- |
* | "Download CSV Template" |
*
* @param {Developerportal_Onboarding_Datamapping_Csvdownloadtemplate4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_csvdownloadtemplate4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Csvdownloadtemplate4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Csvdownloadtemplate4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_csvdownloadtemplate4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_csvdownloadtemplate4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_csvdownloadtemplate4(inputs)
	return ar_developerportal_onboarding_datamapping_csvdownloadtemplate4(inputs)
});
export { developerportal_onboarding_datamapping_csvdownloadtemplate4 as "developerPortal.onboarding.dataMapping.csvDownloadTemplate" }