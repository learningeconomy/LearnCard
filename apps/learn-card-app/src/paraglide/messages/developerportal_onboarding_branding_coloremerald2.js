/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Coloremerald2Inputs */

const en_developerportal_onboarding_branding_coloremerald2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Coloremerald2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emerald`)
};

const es_developerportal_onboarding_branding_coloremerald2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Coloremerald2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esmeralda`)
};

const fr_developerportal_onboarding_branding_coloremerald2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Coloremerald2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émeraude`)
};

const ar_developerportal_onboarding_branding_coloremerald2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Coloremerald2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`زمردي`)
};

/**
* | output |
* | --- |
* | "Emerald" |
*
* @param {Developerportal_Onboarding_Branding_Coloremerald2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_coloremerald2 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Coloremerald2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Coloremerald2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_coloremerald2(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_coloremerald2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_coloremerald2(inputs)
	return ar_developerportal_onboarding_branding_coloremerald2(inputs)
});
export { developerportal_onboarding_branding_coloremerald2 as "developerPortal.onboarding.branding.colorEmerald" }