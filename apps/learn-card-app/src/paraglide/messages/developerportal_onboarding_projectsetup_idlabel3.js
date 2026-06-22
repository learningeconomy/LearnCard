/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ id: NonNullable<unknown> }} Developerportal_Onboarding_Projectsetup_Idlabel3Inputs */

const en_developerportal_onboarding_projectsetup_idlabel3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Idlabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ID: ${i?.id}`)
};

const es_developerportal_onboarding_projectsetup_idlabel3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Idlabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ID: ${i?.id}`)
};

const fr_developerportal_onboarding_projectsetup_idlabel3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Idlabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ID: ${i?.id}`)
};

const ar_developerportal_onboarding_projectsetup_idlabel3 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Idlabel3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`المعرف: ${i?.id}`)
};

/**
* | output |
* | --- |
* | "ID: {id}" |
*
* @param {Developerportal_Onboarding_Projectsetup_Idlabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_idlabel3 = /** @type {((inputs: Developerportal_Onboarding_Projectsetup_Idlabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Idlabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_idlabel3(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_idlabel3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_idlabel3(inputs)
	return ar_developerportal_onboarding_projectsetup_idlabel3(inputs)
});
export { developerportal_onboarding_projectsetup_idlabel3 as "developerPortal.onboarding.projectSetup.idLabel" }