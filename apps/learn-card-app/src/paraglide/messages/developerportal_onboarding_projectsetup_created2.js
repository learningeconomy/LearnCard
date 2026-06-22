/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ date: NonNullable<unknown> }} Developerportal_Onboarding_Projectsetup_Created2Inputs */

const en_developerportal_onboarding_projectsetup_created2 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Created2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Created ${i?.date}`)
};

const es_developerportal_onboarding_projectsetup_created2 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Created2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Creado ${i?.date}`)
};

const fr_developerportal_onboarding_projectsetup_created2 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Created2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Créé le ${i?.date}`)
};

const ar_developerportal_onboarding_projectsetup_created2 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Created2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم الإنشاء ${i?.date}`)
};

/**
* | output |
* | --- |
* | "Created {date}" |
*
* @param {Developerportal_Onboarding_Projectsetup_Created2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_created2 = /** @type {((inputs: Developerportal_Onboarding_Projectsetup_Created2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Created2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_created2(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_created2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_created2(inputs)
	return ar_developerportal_onboarding_projectsetup_created2(inputs)
});
export { developerportal_onboarding_projectsetup_created2 as "developerPortal.onboarding.projectSetup.created" }