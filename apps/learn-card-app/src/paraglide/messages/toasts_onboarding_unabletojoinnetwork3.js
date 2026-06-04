/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Onboarding_Unabletojoinnetwork3Inputs */

const en_toasts_onboarding_unabletojoinnetwork3 = /** @type {(inputs: Toasts_Onboarding_Unabletojoinnetwork3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to join network`)
};

const es_toasts_onboarding_unabletojoinnetwork3 = /** @type {(inputs: Toasts_Onboarding_Unabletojoinnetwork3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo unir a la red`)
};

const de_toasts_onboarding_unabletojoinnetwork3 = /** @type {(inputs: Toasts_Onboarding_Unabletojoinnetwork3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Netzwerk konnte nicht beigetreten werden`)
};

const ar_toasts_onboarding_unabletojoinnetwork3 = /** @type {(inputs: Toasts_Onboarding_Unabletojoinnetwork3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر الانضمام إلى الشبكة`)
};

const fr_toasts_onboarding_unabletojoinnetwork3 = /** @type {(inputs: Toasts_Onboarding_Unabletojoinnetwork3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de rejoindre le réseau`)
};

const ko_toasts_onboarding_unabletojoinnetwork3 = /** @type {(inputs: Toasts_Onboarding_Unabletojoinnetwork3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`네트워크에 가입할 수 없습니다`)
};

/**
* | output |
* | --- |
* | "Unable to join network" |
*
* @param {Toasts_Onboarding_Unabletojoinnetwork3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_onboarding_unabletojoinnetwork3 = /** @type {((inputs?: Toasts_Onboarding_Unabletojoinnetwork3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Onboarding_Unabletojoinnetwork3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_onboarding_unabletojoinnetwork3(inputs)
	if (locale === "es") return es_toasts_onboarding_unabletojoinnetwork3(inputs)
	if (locale === "de") return de_toasts_onboarding_unabletojoinnetwork3(inputs)
	if (locale === "ar") return ar_toasts_onboarding_unabletojoinnetwork3(inputs)
	if (locale === "fr") return fr_toasts_onboarding_unabletojoinnetwork3(inputs)
	return ko_toasts_onboarding_unabletojoinnetwork3(inputs)
});
export { toasts_onboarding_unabletojoinnetwork3 as "toasts.onboarding.unableToJoinNetwork" }