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

const fr_boost_saving = /** @type {(inputs: Boost_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrement...`)
};

const ar_boost_saving = /** @type {(inputs: Boost_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الحفظ...`)
};

/**
* | output |
* | --- |
* | "Saving..." |
*
* @param {Boost_SavingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_saving = /** @type {((inputs?: Boost_SavingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_SavingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_saving(inputs)
	if (locale === "es") return es_boost_saving(inputs)
	if (locale === "fr") return fr_boost_saving(inputs)
	return ar_boost_saving(inputs)
});
export { boost_saving as "boost.saving" }