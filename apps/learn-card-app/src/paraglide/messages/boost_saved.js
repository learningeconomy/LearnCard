/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_SavedInputs */

const en_boost_saved = /** @type {(inputs: Boost_SavedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saved!`)
};

const es_boost_saved = /** @type {(inputs: Boost_SavedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Guardado!`)
};

const de_boost_saved = /** @type {(inputs: Boost_SavedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gespeichert!`)
};

const ar_boost_saved = /** @type {(inputs: Boost_SavedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم الحفظ!`)
};

const fr_boost_saved = /** @type {(inputs: Boost_SavedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistré !`)
};

const ko_boost_saved = /** @type {(inputs: Boost_SavedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`저장됨!`)
};

/**
* | output |
* | --- |
* | "Saved!" |
*
* @param {Boost_SavedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_saved = /** @type {((inputs?: Boost_SavedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_SavedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_saved(inputs)
	if (locale === "es") return es_boost_saved(inputs)
	if (locale === "de") return de_boost_saved(inputs)
	if (locale === "ar") return ar_boost_saved(inputs)
	if (locale === "fr") return fr_boost_saved(inputs)
	return ko_boost_saved(inputs)
});
export { boost_saved as "boost.saved" }