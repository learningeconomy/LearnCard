/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Details_AboutInputs */

const en_troops_details_about = /** @type {(inputs: Troops_Details_AboutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`About`)
};

const es_troops_details_about = /** @type {(inputs: Troops_Details_AboutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acerca de`)
};

const fr_troops_details_about = /** @type {(inputs: Troops_Details_AboutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`À propos`)
};

const ar_troops_details_about = /** @type {(inputs: Troops_Details_AboutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حول`)
};

/**
* | output |
* | --- |
* | "About" |
*
* @param {Troops_Details_AboutInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_details_about = /** @type {((inputs?: Troops_Details_AboutInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Details_AboutInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_details_about(inputs)
	if (locale === "es") return es_troops_details_about(inputs)
	if (locale === "fr") return fr_troops_details_about(inputs)
	return ar_troops_details_about(inputs)
});
export { troops_details_about as "troops.details.about" }