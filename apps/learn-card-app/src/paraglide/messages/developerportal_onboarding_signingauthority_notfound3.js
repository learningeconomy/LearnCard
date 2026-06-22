/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Signingauthority_Notfound3Inputs */

const en_developerportal_onboarding_signingauthority_notfound3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Notfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No signing authority found`)
};

const es_developerportal_onboarding_signingauthority_notfound3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Notfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontró autoridad de firma`)
};

const fr_developerportal_onboarding_signingauthority_notfound3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Notfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune autorité de signature trouvée`)
};

const ar_developerportal_onboarding_signingauthority_notfound3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Notfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على سلطة توقيع`)
};

/**
* | output |
* | --- |
* | "No signing authority found" |
*
* @param {Developerportal_Onboarding_Signingauthority_Notfound3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_signingauthority_notfound3 = /** @type {((inputs?: Developerportal_Onboarding_Signingauthority_Notfound3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Signingauthority_Notfound3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_signingauthority_notfound3(inputs)
	if (locale === "es") return es_developerportal_onboarding_signingauthority_notfound3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_signingauthority_notfound3(inputs)
	return ar_developerportal_onboarding_signingauthority_notfound3(inputs)
});
export { developerportal_onboarding_signingauthority_notfound3 as "developerPortal.onboarding.signingAuthority.notFound" }