/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Details_TitleInputs */

const en_troops_details_title = /** @type {(inputs: Troops_Details_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Details`)
};

const es_troops_details_title = /** @type {(inputs: Troops_Details_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Detalles`)
};

const fr_troops_details_title = /** @type {(inputs: Troops_Details_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Détails`)
};

const ar_troops_details_title = /** @type {(inputs: Troops_Details_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التفاصيل`)
};

/**
* | output |
* | --- |
* | "Details" |
*
* @param {Troops_Details_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_details_title = /** @type {((inputs?: Troops_Details_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Details_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_details_title(inputs)
	if (locale === "es") return es_troops_details_title(inputs)
	if (locale === "fr") return fr_troops_details_title(inputs)
	return ar_troops_details_title(inputs)
});
export { troops_details_title as "troops.details.title" }