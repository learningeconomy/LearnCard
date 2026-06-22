/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Onboarding_Consent_Parentinvite_Heading1Inputs */

const en_onboarding_consent_parentinvite_heading1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Heading1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Invite your parent to join ${i?.brand}!`)
};

const es_onboarding_consent_parentinvite_heading1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Heading1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¡Invita a tu padre/madre a ${i?.brand}!`)
};

const fr_onboarding_consent_parentinvite_heading1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Heading1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Invitez votre parent à rejoindre ${i?.brand} !`)
};

const ar_onboarding_consent_parentinvite_heading1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Heading1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ادعُ والدك للانضمام إلى ${i?.brand}!`)
};

/**
* | output |
* | --- |
* | "Invite your parent to join {brand}!" |
*
* @param {Onboarding_Consent_Parentinvite_Heading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_parentinvite_heading1 = /** @type {((inputs: Onboarding_Consent_Parentinvite_Heading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Parentinvite_Heading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_parentinvite_heading1(inputs)
	if (locale === "es") return es_onboarding_consent_parentinvite_heading1(inputs)
	if (locale === "fr") return fr_onboarding_consent_parentinvite_heading1(inputs)
	return ar_onboarding_consent_parentinvite_heading1(inputs)
});
export { onboarding_consent_parentinvite_heading1 as "onboarding.consent.parentInvite.heading" }