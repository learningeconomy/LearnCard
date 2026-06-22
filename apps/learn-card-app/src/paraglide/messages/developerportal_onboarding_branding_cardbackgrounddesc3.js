/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Cardbackgrounddesc3Inputs */

const en_developerportal_onboarding_branding_cardbackgrounddesc3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Cardbackgrounddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Optional background image for your card`)
};

const es_developerportal_onboarding_branding_cardbackgrounddesc3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Cardbackgrounddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Imagen de fondo opcional para tu tarjeta`)
};

const fr_developerportal_onboarding_branding_cardbackgrounddesc3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Cardbackgrounddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Image d'arrière-plan optionnelle pour votre carte`)
};

const ar_developerportal_onboarding_branding_cardbackgrounddesc3 = /** @type {(inputs: Developerportal_Onboarding_Branding_Cardbackgrounddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صورة خلفية اختيارية لبطاقتك`)
};

/**
* | output |
* | --- |
* | "Optional background image for your card" |
*
* @param {Developerportal_Onboarding_Branding_Cardbackgrounddesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_cardbackgrounddesc3 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Cardbackgrounddesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Cardbackgrounddesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_cardbackgrounddesc3(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_cardbackgrounddesc3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_cardbackgrounddesc3(inputs)
	return ar_developerportal_onboarding_branding_cardbackgrounddesc3(inputs)
});
export { developerportal_onboarding_branding_cardbackgrounddesc3 as "developerPortal.onboarding.branding.cardBackgroundDesc" }