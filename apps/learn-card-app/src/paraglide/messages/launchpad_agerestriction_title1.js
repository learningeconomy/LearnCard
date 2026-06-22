/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Agerestriction_Title1Inputs */

const en_launchpad_agerestriction_title1 = /** @type {(inputs: Launchpad_Agerestriction_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Age Restricted`)
};

const es_launchpad_agerestriction_title1 = /** @type {(inputs: Launchpad_Agerestriction_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restricción de edad`)
};

const fr_launchpad_agerestriction_title1 = /** @type {(inputs: Launchpad_Agerestriction_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restriction d'âge`)
};

const ar_launchpad_agerestriction_title1 = /** @type {(inputs: Launchpad_Agerestriction_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مقيد بالعمر`)
};

/**
* | output |
* | --- |
* | "Age Restricted" |
*
* @param {Launchpad_Agerestriction_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_agerestriction_title1 = /** @type {((inputs?: Launchpad_Agerestriction_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Agerestriction_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_agerestriction_title1(inputs)
	if (locale === "es") return es_launchpad_agerestriction_title1(inputs)
	if (locale === "fr") return fr_launchpad_agerestriction_title1(inputs)
	return ar_launchpad_agerestriction_title1(inputs)
});
export { launchpad_agerestriction_title1 as "launchpad.ageRestriction.title" }