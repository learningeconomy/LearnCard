/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ rating: NonNullable<unknown> }} Launchpad_Appcard_Age1Inputs */

const en_launchpad_appcard_age1 = /** @type {(inputs: Launchpad_Appcard_Age1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Age ${i?.rating}`)
};

const es_launchpad_appcard_age1 = /** @type {(inputs: Launchpad_Appcard_Age1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Edad ${i?.rating}`)
};

const fr_launchpad_appcard_age1 = /** @type {(inputs: Launchpad_Appcard_Age1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Âge ${i?.rating}`)
};

const ar_launchpad_appcard_age1 = /** @type {(inputs: Launchpad_Appcard_Age1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`العمر ${i?.rating}`)
};

/**
* | output |
* | --- |
* | "Age {rating}" |
*
* @param {Launchpad_Appcard_Age1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_appcard_age1 = /** @type {((inputs: Launchpad_Appcard_Age1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Appcard_Age1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_appcard_age1(inputs)
	if (locale === "es") return es_launchpad_appcard_age1(inputs)
	if (locale === "fr") return fr_launchpad_appcard_age1(inputs)
	return ar_launchpad_appcard_age1(inputs)
});
export { launchpad_appcard_age1 as "launchpad.appCard.age" }