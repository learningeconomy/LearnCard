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

const de_onboarding_consent_parentinvite_heading1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Heading1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Lade deine Eltern zu ${i?.brand} ein!`)
};

const ar_onboarding_consent_parentinvite_heading1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Heading1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ادعُ والدك للانضمام إلى ${i?.brand}!`)
};

const fr_onboarding_consent_parentinvite_heading1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Heading1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Invitez votre parent à rejoindre ${i?.brand} !`)
};

const ko_onboarding_consent_parentinvite_heading1 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Heading1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`부모님을 ${i?.brand}에 초대하세요!`)
};

/**
* | output |
* | --- |
* | "Invite your parent to join {brand}!" |
*
* @param {Onboarding_Consent_Parentinvite_Heading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_parentinvite_heading1 = /** @type {((inputs: Onboarding_Consent_Parentinvite_Heading1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Parentinvite_Heading1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_parentinvite_heading1(inputs)
	if (locale === "es") return es_onboarding_consent_parentinvite_heading1(inputs)
	if (locale === "de") return de_onboarding_consent_parentinvite_heading1(inputs)
	if (locale === "ar") return ar_onboarding_consent_parentinvite_heading1(inputs)
	if (locale === "fr") return fr_onboarding_consent_parentinvite_heading1(inputs)
	return ko_onboarding_consent_parentinvite_heading1(inputs)
});
export { onboarding_consent_parentinvite_heading1 as "onboarding.consent.parentInvite.heading" }