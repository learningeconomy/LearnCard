/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Somethingwentwronglabel3Inputs */

const en_boost_somethingwentwronglabel3 = /** @type {(inputs: Boost_Somethingwentwronglabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Something went wrong:`)
};

const es_boost_somethingwentwronglabel3 = /** @type {(inputs: Boost_Somethingwentwronglabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Algo salió mal:`)
};

const fr_boost_somethingwentwronglabel3 = /** @type {(inputs: Boost_Somethingwentwronglabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue :`)
};

const ar_boost_somethingwentwronglabel3 = /** @type {(inputs: Boost_Somethingwentwronglabel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Something went wrong:`)
};

/**
* | output |
* | --- |
* | "Something went wrong:" |
*
* @param {Boost_Somethingwentwronglabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_somethingwentwronglabel3 = /** @type {((inputs?: Boost_Somethingwentwronglabel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Somethingwentwronglabel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_somethingwentwronglabel3(inputs)
	if (locale === "es") return es_boost_somethingwentwronglabel3(inputs)
	if (locale === "fr") return fr_boost_somethingwentwronglabel3(inputs)
	return ar_boost_somethingwentwronglabel3(inputs)
});
export { boost_somethingwentwronglabel3 as "boost.somethingWentWrongLabel" }