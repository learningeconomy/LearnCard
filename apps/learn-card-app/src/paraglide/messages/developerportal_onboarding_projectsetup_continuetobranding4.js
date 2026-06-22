/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Projectsetup_Continuetobranding4Inputs */

const en_developerportal_onboarding_projectsetup_continuetobranding4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Continuetobranding4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue to Branding`)
};

const es_developerportal_onboarding_projectsetup_continuetobranding4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Continuetobranding4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar a Marca`)
};

const fr_developerportal_onboarding_projectsetup_continuetobranding4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Continuetobranding4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer vers l'Image de Marque`)
};

const ar_developerportal_onboarding_projectsetup_continuetobranding4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Continuetobranding4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المتابعة إلى العلامة التجارية`)
};

/**
* | output |
* | --- |
* | "Continue to Branding" |
*
* @param {Developerportal_Onboarding_Projectsetup_Continuetobranding4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_continuetobranding4 = /** @type {((inputs?: Developerportal_Onboarding_Projectsetup_Continuetobranding4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Continuetobranding4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_continuetobranding4(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_continuetobranding4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_continuetobranding4(inputs)
	return ar_developerportal_onboarding_projectsetup_continuetobranding4(inputs)
});
export { developerportal_onboarding_projectsetup_continuetobranding4 as "developerPortal.onboarding.projectSetup.continueToBranding" }