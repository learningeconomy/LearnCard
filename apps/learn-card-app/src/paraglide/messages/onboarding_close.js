/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_CloseInputs */

const en_onboarding_close = /** @type {(inputs: Onboarding_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close`)
};

const es_onboarding_close = /** @type {(inputs: Onboarding_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar`)
};

const de_onboarding_close = /** @type {(inputs: Onboarding_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Schließen`)
};

const ar_onboarding_close = /** @type {(inputs: Onboarding_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إغلاق`)
};

const fr_onboarding_close = /** @type {(inputs: Onboarding_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer`)
};

const ko_onboarding_close = /** @type {(inputs: Onboarding_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`닫기`)
};

/**
* | output |
* | --- |
* | "Close" |
*
* @param {Onboarding_CloseInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_close = /** @type {((inputs?: Onboarding_CloseInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_CloseInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_close(inputs)
	if (locale === "es") return es_onboarding_close(inputs)
	if (locale === "de") return de_onboarding_close(inputs)
	if (locale === "ar") return ar_onboarding_close(inputs)
	if (locale === "fr") return fr_onboarding_close(inputs)
	return ko_onboarding_close(inputs)
});
export { onboarding_close as "onboarding.close" }