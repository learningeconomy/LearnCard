/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Colorblue2Inputs */

const en_developerportal_onboarding_branding_colorblue2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Colorblue2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Blue`)
};

const es_developerportal_onboarding_branding_colorblue2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Colorblue2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Azul`)
};

const fr_developerportal_onboarding_branding_colorblue2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Colorblue2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bleu`)
};

const ar_developerportal_onboarding_branding_colorblue2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Colorblue2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أزرق`)
};

/**
* | output |
* | --- |
* | "Blue" |
*
* @param {Developerportal_Onboarding_Branding_Colorblue2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_colorblue2 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Colorblue2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Colorblue2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_colorblue2(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_colorblue2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_colorblue2(inputs)
	return ar_developerportal_onboarding_branding_colorblue2(inputs)
});
export { developerportal_onboarding_branding_colorblue2 as "developerPortal.onboarding.branding.colorBlue" }