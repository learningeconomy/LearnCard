/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_SaveInputs */

const en_onboarding_save = /** @type {(inputs: Onboarding_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save`)
};

const es_onboarding_save = /** @type {(inputs: Onboarding_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar`)
};

const de_onboarding_save = /** @type {(inputs: Onboarding_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Speichern`)
};

const ar_onboarding_save = /** @type {(inputs: Onboarding_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ`)
};

const fr_onboarding_save = /** @type {(inputs: Onboarding_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer`)
};

const ko_onboarding_save = /** @type {(inputs: Onboarding_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`저장`)
};

/**
* | output |
* | --- |
* | "Save" |
*
* @param {Onboarding_SaveInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_save = /** @type {((inputs?: Onboarding_SaveInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_SaveInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_save(inputs)
	if (locale === "es") return es_onboarding_save(inputs)
	if (locale === "de") return de_onboarding_save(inputs)
	if (locale === "ar") return ar_onboarding_save(inputs)
	if (locale === "fr") return fr_onboarding_save(inputs)
	return ko_onboarding_save(inputs)
});
export { onboarding_save as "onboarding.save" }