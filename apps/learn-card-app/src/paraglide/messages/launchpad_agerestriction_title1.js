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

const de_launchpad_agerestriction_title1 = /** @type {(inputs: Launchpad_Agerestriction_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Altersbeschränkung`)
};

const ar_launchpad_agerestriction_title1 = /** @type {(inputs: Launchpad_Agerestriction_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مقيد بالعمر`)
};

const fr_launchpad_agerestriction_title1 = /** @type {(inputs: Launchpad_Agerestriction_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restriction d'âge`)
};

const ko_launchpad_agerestriction_title1 = /** @type {(inputs: Launchpad_Agerestriction_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연령 제한`)
};

/**
* | output |
* | --- |
* | "Age Restricted" |
*
* @param {Launchpad_Agerestriction_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_agerestriction_title1 = /** @type {((inputs?: Launchpad_Agerestriction_Title1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Agerestriction_Title1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_agerestriction_title1(inputs)
	if (locale === "es") return es_launchpad_agerestriction_title1(inputs)
	if (locale === "de") return de_launchpad_agerestriction_title1(inputs)
	if (locale === "ar") return ar_launchpad_agerestriction_title1(inputs)
	if (locale === "fr") return fr_launchpad_agerestriction_title1(inputs)
	return ko_launchpad_agerestriction_title1(inputs)
});
export { launchpad_agerestriction_title1 as "launchpad.ageRestriction.title" }