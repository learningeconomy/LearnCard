/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Signingauthority_Description2Inputs */

const en_developerportal_onboarding_signingauthority_description2 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A signing authority cryptographically signs your credentials, making them verifiable. This proves the credentials actually came from you.`)
};

const es_developerportal_onboarding_signingauthority_description2 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Una autoridad de firma firma criptográficamente tus credenciales, haciéndolas verificables. Esto demuestra que las credenciales realmente vienen de ti.`)
};

const fr_developerportal_onboarding_signingauthority_description2 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une autorité de signature signe cryptographiquement vos credentials, les rendant vérifiables. Cela prouve que les credentials proviennent bien de vous.`)
};

const ar_developerportal_onboarding_signingauthority_description2 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تقوم سلطة التوقيع بتوقيع بيانات الاعتماد الخاصة بك تشفيرياً، مما يجعلها قابلة للتحقق. هذا يثبت أن بيانات الاعتماد جاءت منك بالفعل.`)
};

/**
* | output |
* | --- |
* | "A signing authority cryptographically signs your credentials, making them verifiable. This proves the credentials actually came from you." |
*
* @param {Developerportal_Onboarding_Signingauthority_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_signingauthority_description2 = /** @type {((inputs?: Developerportal_Onboarding_Signingauthority_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Signingauthority_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_signingauthority_description2(inputs)
	if (locale === "es") return es_developerportal_onboarding_signingauthority_description2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_signingauthority_description2(inputs)
	return ar_developerportal_onboarding_signingauthority_description2(inputs)
});
export { developerportal_onboarding_signingauthority_description2 as "developerPortal.onboarding.signingAuthority.description" }