/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_DescriptionInputs */

const en_onboarding_consent_underage_description = /** @type {(inputs: Onboarding_Consent_Underage_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll need a parent or guardian to add you to a family account before you can join.`)
};

const es_onboarding_consent_underage_description = /** @type {(inputs: Onboarding_Consent_Underage_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Necesitarás que un padre o tutor te agregue a una cuenta familiar antes de poder unirte.`)
};

const de_onboarding_consent_underage_description = /** @type {(inputs: Onboarding_Consent_Underage_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Du brauchst einen Elternteil oder Erziehungsberechtigten, der dich zu einem Familienkonto hinzufügt, bevor du beitreten kannst.`)
};

const ar_onboarding_consent_underage_description = /** @type {(inputs: Onboarding_Consent_Underage_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ستحتاج إلى والد أو ولي أمر ليضيفك إلى حساب عائلي قبل أن تتمكن من الانضمام.`)
};

const fr_onboarding_consent_underage_description = /** @type {(inputs: Onboarding_Consent_Underage_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous aurez besoin qu'un parent ou tuteur vous ajoute à un compte familial avant de pouvoir rejoindre.`)
};

const ko_onboarding_consent_underage_description = /** @type {(inputs: Onboarding_Consent_Underage_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`참여하려면 부모 또는 보호자가 가족 계정에 추가해야 합니다.`)
};

/**
* | output |
* | --- |
* | "You'll need a parent or guardian to add you to a family account before you can join." |
*
* @param {Onboarding_Consent_Underage_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_description = /** @type {((inputs?: Onboarding_Consent_Underage_DescriptionInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_DescriptionInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_description(inputs)
	if (locale === "es") return es_onboarding_consent_underage_description(inputs)
	if (locale === "de") return de_onboarding_consent_underage_description(inputs)
	if (locale === "ar") return ar_onboarding_consent_underage_description(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_description(inputs)
	return ko_onboarding_consent_underage_description(inputs)
});
export { onboarding_consent_underage_description as "onboarding.consent.underage.description" }