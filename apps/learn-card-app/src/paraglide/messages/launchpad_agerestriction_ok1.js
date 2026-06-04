/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Agerestriction_Ok1Inputs */

const en_launchpad_agerestriction_ok1 = /** @type {(inputs: Launchpad_Agerestriction_Ok1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OK`)
};

const es_launchpad_agerestriction_ok1 = /** @type {(inputs: Launchpad_Agerestriction_Ok1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OK`)
};

const de_launchpad_agerestriction_ok1 = /** @type {(inputs: Launchpad_Agerestriction_Ok1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OK`)
};

const ar_launchpad_agerestriction_ok1 = /** @type {(inputs: Launchpad_Agerestriction_Ok1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حسناً`)
};

const fr_launchpad_agerestriction_ok1 = /** @type {(inputs: Launchpad_Agerestriction_Ok1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OK`)
};

const ko_launchpad_agerestriction_ok1 = /** @type {(inputs: Launchpad_Agerestriction_Ok1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`확인`)
};

/**
* | output |
* | --- |
* | "OK" |
*
* @param {Launchpad_Agerestriction_Ok1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_agerestriction_ok1 = /** @type {((inputs?: Launchpad_Agerestriction_Ok1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Agerestriction_Ok1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_agerestriction_ok1(inputs)
	if (locale === "es") return es_launchpad_agerestriction_ok1(inputs)
	if (locale === "de") return de_launchpad_agerestriction_ok1(inputs)
	if (locale === "ar") return ar_launchpad_agerestriction_ok1(inputs)
	if (locale === "fr") return fr_launchpad_agerestriction_ok1(inputs)
	return ko_launchpad_agerestriction_ok1(inputs)
});
export { launchpad_agerestriction_ok1 as "launchpad.ageRestriction.ok" }