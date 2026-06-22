/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Csvissuancefieldsdesc5Inputs */

const en_developerportal_onboarding_templatebuilder_csvissuancefieldsdesc5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvissuancefieldsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dynamic = you provide at issuance time`)
};

const es_developerportal_onboarding_templatebuilder_csvissuancefieldsdesc5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvissuancefieldsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dinámico = lo proporcionas al momento de emitir`)
};

const fr_developerportal_onboarding_templatebuilder_csvissuancefieldsdesc5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvissuancefieldsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dynamique = vous fournissez au moment de l'émission`)
};

const ar_developerportal_onboarding_templatebuilder_csvissuancefieldsdesc5 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvissuancefieldsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ديناميكي = تقدمه عند وقت الإصدار`)
};

/**
* | output |
* | --- |
* | "Dynamic = you provide at issuance time" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvissuancefieldsdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvissuancefieldsdesc5 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Csvissuancefieldsdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvissuancefieldsdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvissuancefieldsdesc5(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvissuancefieldsdesc5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvissuancefieldsdesc5(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvissuancefieldsdesc5(inputs)
});
export { developerportal_onboarding_templatebuilder_csvissuancefieldsdesc5 as "developerPortal.onboarding.templateBuilder.csvIssuanceFieldsDesc" }