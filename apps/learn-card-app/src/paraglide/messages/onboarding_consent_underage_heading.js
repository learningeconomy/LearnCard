/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_HeadingInputs */

const en_onboarding_consent_underage_heading = /** @type {(inputs: Onboarding_Consent_Underage_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get an Adult`)
};

const es_onboarding_consent_underage_heading = /** @type {(inputs: Onboarding_Consent_Underage_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Busca un adulto`)
};

const de_onboarding_consent_underage_heading = /** @type {(inputs: Onboarding_Consent_Underage_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hol einen Erwachsenen`)
};

const ar_onboarding_consent_underage_heading = /** @type {(inputs: Onboarding_Consent_Underage_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أحضر شخصاً بالغاً`)
};

const fr_onboarding_consent_underage_heading = /** @type {(inputs: Onboarding_Consent_Underage_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trouvez un adulte`)
};

const ko_onboarding_consent_underage_heading = /** @type {(inputs: Onboarding_Consent_Underage_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`성인에게 문의하세요`)
};

/**
* | output |
* | --- |
* | "Get an Adult" |
*
* @param {Onboarding_Consent_Underage_HeadingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_heading = /** @type {((inputs?: Onboarding_Consent_Underage_HeadingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_HeadingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_heading(inputs)
	if (locale === "es") return es_onboarding_consent_underage_heading(inputs)
	if (locale === "de") return de_onboarding_consent_underage_heading(inputs)
	if (locale === "ar") return ar_onboarding_consent_underage_heading(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_heading(inputs)
	return ko_onboarding_consent_underage_heading(inputs)
});
export { onboarding_consent_underage_heading as "onboarding.consent.underage.heading" }