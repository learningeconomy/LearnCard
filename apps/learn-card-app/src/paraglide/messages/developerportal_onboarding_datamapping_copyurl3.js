/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Copyurl3Inputs */

const en_developerportal_onboarding_datamapping_copyurl3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Copyurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy URL`)
};

const es_developerportal_onboarding_datamapping_copyurl3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Copyurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar URL`)
};

const fr_developerportal_onboarding_datamapping_copyurl3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Copyurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier l'URL`)
};

const ar_developerportal_onboarding_datamapping_copyurl3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Copyurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ العنوان`)
};

/**
* | output |
* | --- |
* | "Copy URL" |
*
* @param {Developerportal_Onboarding_Datamapping_Copyurl3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_copyurl3 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Copyurl3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Copyurl3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_copyurl3(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_copyurl3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_copyurl3(inputs)
	return ar_developerportal_onboarding_datamapping_copyurl3(inputs)
});
export { developerportal_onboarding_datamapping_copyurl3 as "developerPortal.onboarding.dataMapping.copyUrl" }