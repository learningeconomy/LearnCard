/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Onboarding_Consent_Underage_Addchild_Heading1Inputs */

const en_onboarding_consent_underage_addchild_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Addchild_Heading1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Add Your Child to ${i?.brand}!`)
};

const es_onboarding_consent_underage_addchild_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Addchild_Heading1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¡Agrega a tu hijo a ${i?.brand}!`)
};

const de_onboarding_consent_underage_addchild_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Addchild_Heading1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Füge dein Kind zu ${i?.brand} hinzu!`)
};

const ar_onboarding_consent_underage_addchild_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Addchild_Heading1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`أضف طفلك إلى ${i?.brand}!`)
};

const fr_onboarding_consent_underage_addchild_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Addchild_Heading1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ajoutez votre enfant à ${i?.brand} !`)
};

const ko_onboarding_consent_underage_addchild_heading1 = /** @type {(inputs: Onboarding_Consent_Underage_Addchild_Heading1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.brand}에 자녀를 추가하세요!`)
};

/**
* | output |
* | --- |
* | "Add Your Child to {brand}!" |
*
* @param {Onboarding_Consent_Underage_Addchild_Heading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_addchild_heading1 = /** @type {((inputs: Onboarding_Consent_Underage_Addchild_Heading1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Addchild_Heading1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_addchild_heading1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_addchild_heading1(inputs)
	if (locale === "de") return de_onboarding_consent_underage_addchild_heading1(inputs)
	if (locale === "ar") return ar_onboarding_consent_underage_addchild_heading1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_addchild_heading1(inputs)
	return ko_onboarding_consent_underage_addchild_heading1(inputs)
});
export { onboarding_consent_underage_addchild_heading1 as "onboarding.consent.underage.addChild.heading" }