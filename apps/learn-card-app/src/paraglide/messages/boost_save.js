/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_SaveInputs */

const en_boost_save = /** @type {(inputs: Boost_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save`)
};

const es_boost_save = /** @type {(inputs: Boost_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar`)
};

const de_boost_save = /** @type {(inputs: Boost_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Speichern`)
};

const ar_boost_save = /** @type {(inputs: Boost_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ`)
};

const fr_boost_save = /** @type {(inputs: Boost_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer`)
};

const ko_boost_save = /** @type {(inputs: Boost_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`저장`)
};

/**
* | output |
* | --- |
* | "Save" |
*
* @param {Boost_SaveInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_save = /** @type {((inputs?: Boost_SaveInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_SaveInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_save(inputs)
	if (locale === "es") return es_boost_save(inputs)
	if (locale === "de") return de_boost_save(inputs)
	if (locale === "ar") return ar_boost_save(inputs)
	if (locale === "fr") return fr_boost_save(inputs)
	return ko_boost_save(inputs)
});
export { boost_save as "boost.save" }