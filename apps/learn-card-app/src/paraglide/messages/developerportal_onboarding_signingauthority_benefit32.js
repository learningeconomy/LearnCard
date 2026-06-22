/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Signingauthority_Benefit32Inputs */

const en_developerportal_onboarding_signingauthority_benefit32 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Benefit32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Allows anyone to verify credentials you issue`)
};

const es_developerportal_onboarding_signingauthority_benefit32 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Benefit32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permite que cualquiera verifique las credenciales que emitas`)
};

const fr_developerportal_onboarding_signingauthority_benefit32 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Benefit32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permet à quiconque de vérifier les credentials que vous émettez`)
};

const ar_developerportal_onboarding_signingauthority_benefit32 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Benefit32Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يسمح لأي شخص بالتحقق من بيانات الاعتماد التي تصدرها`)
};

/**
* | output |
* | --- |
* | "Allows anyone to verify credentials you issue" |
*
* @param {Developerportal_Onboarding_Signingauthority_Benefit32Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_signingauthority_benefit32 = /** @type {((inputs?: Developerportal_Onboarding_Signingauthority_Benefit32Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Signingauthority_Benefit32Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_signingauthority_benefit32(inputs)
	if (locale === "es") return es_developerportal_onboarding_signingauthority_benefit32(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_signingauthority_benefit32(inputs)
	return ar_developerportal_onboarding_signingauthority_benefit32(inputs)
});
export { developerportal_onboarding_signingauthority_benefit32 as "developerPortal.onboarding.signingAuthority.benefit3" }