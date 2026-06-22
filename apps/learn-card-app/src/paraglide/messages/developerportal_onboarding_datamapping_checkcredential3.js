/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Checkcredential3Inputs */

const en_developerportal_onboarding_datamapping_checkcredential3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Checkcredential3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check for Issued Credential`)
};

const es_developerportal_onboarding_datamapping_checkcredential3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Checkcredential3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificar Credencial Emitida`)
};

const fr_developerportal_onboarding_datamapping_checkcredential3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Checkcredential3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier le Credential Émis`)
};

const ar_developerportal_onboarding_datamapping_checkcredential3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Checkcredential3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التحقق من بيانات الاعتماد الصادرة`)
};

/**
* | output |
* | --- |
* | "Check for Issued Credential" |
*
* @param {Developerportal_Onboarding_Datamapping_Checkcredential3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_checkcredential3 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Checkcredential3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Checkcredential3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_checkcredential3(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_checkcredential3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_checkcredential3(inputs)
	return ar_developerportal_onboarding_datamapping_checkcredential3(inputs)
});
export { developerportal_onboarding_datamapping_checkcredential3 as "developerPortal.onboarding.dataMapping.checkCredential" }