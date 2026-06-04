/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_SavingInputs */

const en_boost_saving = /** @type {(inputs: Boost_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saving...`)
};

const es_boost_saving = /** @type {(inputs: Boost_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardando...`)
};

const de_boost_saving = /** @type {(inputs: Boost_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Speichern...`)
};

const ar_boost_saving = /** @type {(inputs: Boost_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الحفظ...`)
};

const fr_boost_saving = /** @type {(inputs: Boost_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrement...`)
};

const ko_boost_saving = /** @type {(inputs: Boost_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`저장 중...`)
};

/**
* | output |
* | --- |
* | "Saving..." |
*
* @param {Boost_SavingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_saving = /** @type {((inputs?: Boost_SavingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_SavingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_saving(inputs)
	if (locale === "es") return es_boost_saving(inputs)
	if (locale === "de") return de_boost_saving(inputs)
	if (locale === "ar") return ar_boost_saving(inputs)
	if (locale === "fr") return fr_boost_saving(inputs)
	return ko_boost_saving(inputs)
});
export { boost_saving as "boost.saving" }