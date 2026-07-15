/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Therewasanerror3Inputs */

const en_boost_therewasanerror3 = /** @type {(inputs: Boost_Therewasanerror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`There was an error!`)
};

const es_boost_therewasanerror3 = /** @type {(inputs: Boost_Therewasanerror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Hubo un error!`)
};

const fr_boost_therewasanerror3 = /** @type {(inputs: Boost_Therewasanerror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue !`)
};

const ar_boost_therewasanerror3 = /** @type {(inputs: Boost_Therewasanerror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ!`)
};

/**
* | output |
* | --- |
* | "There was an error!" |
*
* @param {Boost_Therewasanerror3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_therewasanerror3 = /** @type {((inputs?: Boost_Therewasanerror3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Therewasanerror3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_therewasanerror3(inputs)
	if (locale === "es") return es_boost_therewasanerror3(inputs)
	if (locale === "fr") return fr_boost_therewasanerror3(inputs)
	return ar_boost_therewasanerror3(inputs)
});
export { boost_therewasanerror3 as "boost.thereWasAnError" }