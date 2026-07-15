/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Worldscoutingregion2Inputs */

const en_troops_worldscoutingregion2 = /** @type {(inputs: Troops_Worldscoutingregion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`World Scouting Region`)
};

const es_troops_worldscoutingregion2 = /** @type {(inputs: Troops_Worldscoutingregion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Región Mundial del Escultismo`)
};

const fr_troops_worldscoutingregion2 = /** @type {(inputs: Troops_Worldscoutingregion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Région scoute mondiale`)
};

const ar_troops_worldscoutingregion2 = /** @type {(inputs: Troops_Worldscoutingregion2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المنطقة الكشفية العالمية`)
};

/**
* | output |
* | --- |
* | "World Scouting Region" |
*
* @param {Troops_Worldscoutingregion2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_worldscoutingregion2 = /** @type {((inputs?: Troops_Worldscoutingregion2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Worldscoutingregion2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_worldscoutingregion2(inputs)
	if (locale === "es") return es_troops_worldscoutingregion2(inputs)
	if (locale === "fr") return fr_troops_worldscoutingregion2(inputs)
	return ar_troops_worldscoutingregion2(inputs)
});
export { troops_worldscoutingregion2 as "troops.worldScoutingRegion" }