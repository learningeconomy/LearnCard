/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Skipfornow2Inputs */

const en_onboarding_skipfornow2 = /** @type {(inputs: Onboarding_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skip For Now`)
};

const es_onboarding_skipfornow2 = /** @type {(inputs: Onboarding_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Omitir por ahora`)
};

const de_onboarding_skipfornow2 = /** @type {(inputs: Onboarding_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erstmal überspringen`)
};

const ar_onboarding_skipfornow2 = /** @type {(inputs: Onboarding_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخطي في الوقت الحالي`)
};

const fr_onboarding_skipfornow2 = /** @type {(inputs: Onboarding_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passer pour l'instant`)
};

const ko_onboarding_skipfornow2 = /** @type {(inputs: Onboarding_Skipfornow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`지금은 건너뛰기`)
};

/**
* | output |
* | --- |
* | "Skip For Now" |
*
* @param {Onboarding_Skipfornow2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_skipfornow2 = /** @type {((inputs?: Onboarding_Skipfornow2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Skipfornow2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_skipfornow2(inputs)
	if (locale === "es") return es_onboarding_skipfornow2(inputs)
	if (locale === "de") return de_onboarding_skipfornow2(inputs)
	if (locale === "ar") return ar_onboarding_skipfornow2(inputs)
	if (locale === "fr") return fr_onboarding_skipfornow2(inputs)
	return ko_onboarding_skipfornow2(inputs)
});
export { onboarding_skipfornow2 as "onboarding.skipForNow" }