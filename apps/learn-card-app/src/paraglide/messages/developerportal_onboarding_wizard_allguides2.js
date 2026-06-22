/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Wizard_Allguides2Inputs */

const en_developerportal_onboarding_wizard_allguides2 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Allguides2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All Guides`)
};

const es_developerportal_onboarding_wizard_allguides2 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Allguides2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todas las Guías`)
};

const fr_developerportal_onboarding_wizard_allguides2 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Allguides2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tous les Guides`)
};

const ar_developerportal_onboarding_wizard_allguides2 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Allguides2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جميع الأدلة`)
};

/**
* | output |
* | --- |
* | "All Guides" |
*
* @param {Developerportal_Onboarding_Wizard_Allguides2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_wizard_allguides2 = /** @type {((inputs?: Developerportal_Onboarding_Wizard_Allguides2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Wizard_Allguides2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_wizard_allguides2(inputs)
	if (locale === "es") return es_developerportal_onboarding_wizard_allguides2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_wizard_allguides2(inputs)
	return ar_developerportal_onboarding_wizard_allguides2(inputs)
});
export { developerportal_onboarding_wizard_allguides2 as "developerPortal.onboarding.wizard.allGuides" }