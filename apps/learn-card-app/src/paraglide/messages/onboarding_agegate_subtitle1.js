/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Agegate_Subtitle1Inputs */

const en_onboarding_agegate_subtitle1 = /** @type {(inputs: Onboarding_Agegate_Subtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We ask for this information to make sure we comply with privacy laws and keep you safe`)
};

const es_onboarding_agegate_subtitle1 = /** @type {(inputs: Onboarding_Agegate_Subtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitamos esta información para asegurarnos de cumplir con las leyes de privacidad y mantenerte seguro`)
};

const fr_onboarding_agegate_subtitle1 = /** @type {(inputs: Onboarding_Agegate_Subtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous demandons ces informations pour nous assurer de respecter les lois sur la confidentialité et d'assurer votre sécurité`)
};

const ar_onboarding_agegate_subtitle1 = /** @type {(inputs: Onboarding_Agegate_Subtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نطلب هذه المعلومات للتأكد من امتثالنا لقوانين الخصوصية وللحفاظ على سلامتك`)
};

/**
* | output |
* | --- |
* | "We ask for this information to make sure we comply with privacy laws and keep you safe" |
*
* @param {Onboarding_Agegate_Subtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_agegate_subtitle1 = /** @type {((inputs?: Onboarding_Agegate_Subtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Agegate_Subtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_agegate_subtitle1(inputs)
	if (locale === "es") return es_onboarding_agegate_subtitle1(inputs)
	if (locale === "fr") return fr_onboarding_agegate_subtitle1(inputs)
	return ar_onboarding_agegate_subtitle1(inputs)
});
export { onboarding_agegate_subtitle1 as "onboarding.ageGate.subtitle" }