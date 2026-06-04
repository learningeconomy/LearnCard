/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Guardianlinked_Gotit2Inputs */

const en_onboarding_guardianlinked_gotit2 = /** @type {(inputs: Onboarding_Guardianlinked_Gotit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Got it`)
};

const es_onboarding_guardianlinked_gotit2 = /** @type {(inputs: Onboarding_Guardianlinked_Gotit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entendido`)
};

const de_onboarding_guardianlinked_gotit2 = /** @type {(inputs: Onboarding_Guardianlinked_Gotit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verstanden`)
};

const ar_onboarding_guardianlinked_gotit2 = /** @type {(inputs: Onboarding_Guardianlinked_Gotit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فهمت`)
};

const fr_onboarding_guardianlinked_gotit2 = /** @type {(inputs: Onboarding_Guardianlinked_Gotit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compris`)
};

const ko_onboarding_guardianlinked_gotit2 = /** @type {(inputs: Onboarding_Guardianlinked_Gotit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`확인했습니다`)
};

/**
* | output |
* | --- |
* | "Got it" |
*
* @param {Onboarding_Guardianlinked_Gotit2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_guardianlinked_gotit2 = /** @type {((inputs?: Onboarding_Guardianlinked_Gotit2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Guardianlinked_Gotit2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_guardianlinked_gotit2(inputs)
	if (locale === "es") return es_onboarding_guardianlinked_gotit2(inputs)
	if (locale === "de") return de_onboarding_guardianlinked_gotit2(inputs)
	if (locale === "ar") return ar_onboarding_guardianlinked_gotit2(inputs)
	if (locale === "fr") return fr_onboarding_guardianlinked_gotit2(inputs)
	return ko_onboarding_guardianlinked_gotit2(inputs)
});
export { onboarding_guardianlinked_gotit2 as "onboarding.guardianLinked.gotIt" }