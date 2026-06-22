/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Accentcolorinput3Inputs */

const en_developerportal_onboarding_branding_accentcolorinput3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Accentcolorinput3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accent Color`)
};

const es_developerportal_onboarding_branding_accentcolorinput3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Accentcolorinput3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color de Acento`)
};

const fr_developerportal_onboarding_branding_accentcolorinput3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Accentcolorinput3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couleur d'Accent`)
};

const ar_developerportal_onboarding_branding_accentcolorinput3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Accentcolorinput3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لون التمييز`)
};

/**
* | output |
* | --- |
* | "Accent Color" |
*
* @param {Developerportal_Onboarding_Branding_Accentcolorinput3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_accentcolorinput3 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Accentcolorinput3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Accentcolorinput3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_accentcolorinput3(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_accentcolorinput3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_accentcolorinput3(inputs)
	return ar_developerportal_onboarding_branding_accentcolorinput3(inputs)
});
export { developerportal_onboarding_branding_accentcolorinput3 as "developerPortal.onboarding.branding.accentColorInput" }