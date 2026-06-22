/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Boost_Boostsavedsuccess2Inputs */

const en_toasts_boost_boostsavedsuccess2 = /** @type {(inputs: Toasts_Boost_Boostsavedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost saved successfully`)
};

const es_toasts_boost_boostsavedsuccess2 = /** @type {(inputs: Toasts_Boost_Boostsavedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost guardado exitosamente`)
};

const fr_toasts_boost_boostsavedsuccess2 = /** @type {(inputs: Toasts_Boost_Boostsavedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost enregistré avec succès`)
};

const ar_toasts_boost_boostsavedsuccess2 = /** @type {(inputs: Toasts_Boost_Boostsavedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حفظ Boost بنجاح`)
};

/**
* | output |
* | --- |
* | "Boost saved successfully" |
*
* @param {Toasts_Boost_Boostsavedsuccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_boost_boostsavedsuccess2 = /** @type {((inputs?: Toasts_Boost_Boostsavedsuccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Boostsavedsuccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_boostsavedsuccess2(inputs)
	if (locale === "es") return es_toasts_boost_boostsavedsuccess2(inputs)
	if (locale === "fr") return fr_toasts_boost_boostsavedsuccess2(inputs)
	return ar_toasts_boost_boostsavedsuccess2(inputs)
});
export { toasts_boost_boostsavedsuccess2 as "toasts.boost.boostSavedSuccess" }