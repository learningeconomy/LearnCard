/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Selectrole_Header1Inputs */

const en_onboarding_selectrole_header1 = /** @type {(inputs: Onboarding_Selectrole_Header1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select what best describes you!`)
};

const es_onboarding_selectrole_header1 = /** @type {(inputs: Onboarding_Selectrole_Header1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Selecciona lo que mejor te describe!`)
};

const de_onboarding_selectrole_header1 = /** @type {(inputs: Onboarding_Selectrole_Header1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wähle aus, was dich am besten beschreibt!`)
};

const ar_onboarding_selectrole_header1 = /** @type {(inputs: Onboarding_Selectrole_Header1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر ما يصفك بشكل أفضل!`)
};

const fr_onboarding_selectrole_header1 = /** @type {(inputs: Onboarding_Selectrole_Header1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez ce qui vous décrit le mieux !`)
};

const ko_onboarding_selectrole_header1 = /** @type {(inputs: Onboarding_Selectrole_Header1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자신을 가장 잘 설명하는 것을 선택하세요!`)
};

/**
* | output |
* | --- |
* | "Select what best describes you!" |
*
* @param {Onboarding_Selectrole_Header1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_selectrole_header1 = /** @type {((inputs?: Onboarding_Selectrole_Header1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Selectrole_Header1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_selectrole_header1(inputs)
	if (locale === "es") return es_onboarding_selectrole_header1(inputs)
	if (locale === "de") return de_onboarding_selectrole_header1(inputs)
	if (locale === "ar") return ar_onboarding_selectrole_header1(inputs)
	if (locale === "fr") return fr_onboarding_selectrole_header1(inputs)
	return ko_onboarding_selectrole_header1(inputs)
});
export { onboarding_selectrole_header1 as "onboarding.selectRole.header" }