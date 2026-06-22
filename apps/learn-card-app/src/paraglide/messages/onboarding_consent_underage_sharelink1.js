/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_Sharelink1Inputs */

const en_onboarding_consent_underage_sharelink1 = /** @type {(inputs: Onboarding_Consent_Underage_Sharelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share this link with your parent so they can finish setting up the family.`)
};

const es_onboarding_consent_underage_sharelink1 = /** @type {(inputs: Onboarding_Consent_Underage_Sharelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comparte este enlace con tu padre/madre para que pueda terminar de configurar la familia.`)
};

const fr_onboarding_consent_underage_sharelink1 = /** @type {(inputs: Onboarding_Consent_Underage_Sharelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partagez ce lien avec votre parent pour qu'il puisse terminer la configuration de la famille.`)
};

const ar_onboarding_consent_underage_sharelink1 = /** @type {(inputs: Onboarding_Consent_Underage_Sharelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارك هذا الرابط مع والدك ليتمكن من إكمال إعداد العائلة.`)
};

/**
* | output |
* | --- |
* | "Share this link with your parent so they can finish setting up the family." |
*
* @param {Onboarding_Consent_Underage_Sharelink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_sharelink1 = /** @type {((inputs?: Onboarding_Consent_Underage_Sharelink1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Sharelink1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_sharelink1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_sharelink1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_sharelink1(inputs)
	return ar_onboarding_consent_underage_sharelink1(inputs)
});
export { onboarding_consent_underage_sharelink1 as "onboarding.consent.underage.shareLink" }