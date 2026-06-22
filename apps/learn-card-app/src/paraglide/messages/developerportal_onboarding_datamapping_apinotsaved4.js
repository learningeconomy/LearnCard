/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Apinotsaved4Inputs */

const en_developerportal_onboarding_datamapping_apinotsaved4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apinotsaved4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not saved yet`)
};

const es_developerportal_onboarding_datamapping_apinotsaved4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apinotsaved4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no guardado`)
};

const fr_developerportal_onboarding_datamapping_apinotsaved4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apinotsaved4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas encore enregistré`)
};

const ar_developerportal_onboarding_datamapping_apinotsaved4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apinotsaved4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم الحفظ بعد`)
};

/**
* | output |
* | --- |
* | "Not saved yet" |
*
* @param {Developerportal_Onboarding_Datamapping_Apinotsaved4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_apinotsaved4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Apinotsaved4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Apinotsaved4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_apinotsaved4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_apinotsaved4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_apinotsaved4(inputs)
	return ar_developerportal_onboarding_datamapping_apinotsaved4(inputs)
});
export { developerportal_onboarding_datamapping_apinotsaved4 as "developerPortal.onboarding.dataMapping.apiNotSaved" }