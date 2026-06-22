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

const fr_onboarding_consent_underage_description = /** @type {(inputs: Onboarding_Consent_Underage_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous aurez besoin qu'un parent ou tuteur vous ajoute à un compte familial avant de pouvoir rejoindre.`)
};

const ar_onboarding_consent_underage_description = /** @type {(inputs: Onboarding_Consent_Underage_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ستحتاج إلى والد أو ولي أمر ليضيفك إلى حساب عائلي قبل أن تتمكن من الانضمام.`)
};

/**
* | output |
* | --- |
* | "You'll need a parent or guardian to add you to a family account before you can join." |
*
* @param {Onboarding_Consent_Underage_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_description = /** @type {((inputs?: Onboarding_Consent_Underage_DescriptionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_DescriptionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_description(inputs)
	if (locale === "es") return es_onboarding_consent_underage_description(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_description(inputs)
	return ar_onboarding_consent_underage_description(inputs)
});
export { onboarding_consent_underage_description as "onboarding.consent.underage.description" }