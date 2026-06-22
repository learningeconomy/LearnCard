/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Signingauthority_Whatdoesthisdo5Inputs */

const en_developerportal_onboarding_signingauthority_whatdoesthisdo5 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Whatdoesthisdo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What does this do?`)
};

const es_developerportal_onboarding_signingauthority_whatdoesthisdo5 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Whatdoesthisdo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Qué hace esto?`)
};

const fr_developerportal_onboarding_signingauthority_whatdoesthisdo5 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Whatdoesthisdo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Qu'est-ce que cela fait ?`)
};

const ar_developerportal_onboarding_signingauthority_whatdoesthisdo5 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Whatdoesthisdo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ماذا يفعل هذا؟`)
};

/**
* | output |
* | --- |
* | "What does this do?" |
*
* @param {Developerportal_Onboarding_Signingauthority_Whatdoesthisdo5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_signingauthority_whatdoesthisdo5 = /** @type {((inputs?: Developerportal_Onboarding_Signingauthority_Whatdoesthisdo5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Signingauthority_Whatdoesthisdo5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_signingauthority_whatdoesthisdo5(inputs)
	if (locale === "es") return es_developerportal_onboarding_signingauthority_whatdoesthisdo5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_signingauthority_whatdoesthisdo5(inputs)
	return ar_developerportal_onboarding_signingauthority_whatdoesthisdo5(inputs)
});
export { developerportal_onboarding_signingauthority_whatdoesthisdo5 as "developerPortal.onboarding.signingAuthority.whatDoesThisDo" }