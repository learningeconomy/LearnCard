/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Details_Ondate1Inputs */

const en_troops_details_ondate1 = /** @type {(inputs: Troops_Details_Ondate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`on {date}`)
};

const es_troops_details_ondate1 = /** @type {(inputs: Troops_Details_Ondate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`el {date}`)
};

const fr_troops_details_ondate1 = /** @type {(inputs: Troops_Details_Ondate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`le {date}`)
};

const ar_troops_details_ondate1 = /** @type {(inputs: Troops_Details_Ondate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`on {date}`)
};

/**
* | output |
* | --- |
* | "on {date}" |
*
* @param {Troops_Details_Ondate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_details_ondate1 = /** @type {((inputs?: Troops_Details_Ondate1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Details_Ondate1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_details_ondate1(inputs)
	if (locale === "es") return es_troops_details_ondate1(inputs)
	if (locale === "fr") return fr_troops_details_ondate1(inputs)
	return ar_troops_details_ondate1(inputs)
});
export { troops_details_ondate1 as "troops.details.onDate" }