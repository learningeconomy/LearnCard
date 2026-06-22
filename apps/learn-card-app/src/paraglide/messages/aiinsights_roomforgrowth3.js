/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Roomforgrowth3Inputs */

const en_aiinsights_roomforgrowth3 = /** @type {(inputs: Aiinsights_Roomforgrowth3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Room for Growth`)
};

const es_aiinsights_roomforgrowth3 = /** @type {(inputs: Aiinsights_Roomforgrowth3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Espacio para crecer`)
};

const fr_aiinsights_roomforgrowth3 = /** @type {(inputs: Aiinsights_Roomforgrowth3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marge de progression`)
};

const ar_aiinsights_roomforgrowth3 = /** @type {(inputs: Aiinsights_Roomforgrowth3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مجال للنمو`)
};

/**
* | output |
* | --- |
* | "Room for Growth" |
*
* @param {Aiinsights_Roomforgrowth3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_roomforgrowth3 = /** @type {((inputs?: Aiinsights_Roomforgrowth3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Roomforgrowth3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_roomforgrowth3(inputs)
	if (locale === "es") return es_aiinsights_roomforgrowth3(inputs)
	if (locale === "fr") return fr_aiinsights_roomforgrowth3(inputs)
	return ar_aiinsights_roomforgrowth3(inputs)
});
export { aiinsights_roomforgrowth3 as "aiInsights.roomForGrowth" }