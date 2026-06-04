/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Agerestriction_Requiresagebefore3Inputs */

const en_launchpad_agerestriction_requiresagebefore3 = /** @type {(inputs: Launchpad_Agerestriction_Requiresagebefore3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This app requires users to be `)
};

const es_launchpad_agerestriction_requiresagebefore3 = /** @type {(inputs: Launchpad_Agerestriction_Requiresagebefore3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta app requiere que los usuarios tengan `)
};

const de_launchpad_agerestriction_requiresagebefore3 = /** @type {(inputs: Launchpad_Agerestriction_Requiresagebefore3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Diese App erfordert, dass Benutzer `)
};

const ar_launchpad_agerestriction_requiresagebefore3 = /** @type {(inputs: Launchpad_Agerestriction_Requiresagebefore3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتطلب هذا التطبيق أن يكون المستخدمون `)
};

const fr_launchpad_agerestriction_requiresagebefore3 = /** @type {(inputs: Launchpad_Agerestriction_Requiresagebefore3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette application exige que les utilisateurs aient `)
};

const ko_launchpad_agerestriction_requiresagebefore3 = /** @type {(inputs: Launchpad_Agerestriction_Requiresagebefore3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 앱은 사용자가 `)
};

/**
* | output |
* | --- |
* | "This app requires users to be" |
*
* @param {Launchpad_Agerestriction_Requiresagebefore3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_agerestriction_requiresagebefore3 = /** @type {((inputs?: Launchpad_Agerestriction_Requiresagebefore3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Agerestriction_Requiresagebefore3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_agerestriction_requiresagebefore3(inputs)
	if (locale === "es") return es_launchpad_agerestriction_requiresagebefore3(inputs)
	if (locale === "de") return de_launchpad_agerestriction_requiresagebefore3(inputs)
	if (locale === "ar") return ar_launchpad_agerestriction_requiresagebefore3(inputs)
	if (locale === "fr") return fr_launchpad_agerestriction_requiresagebefore3(inputs)
	return ko_launchpad_agerestriction_requiresagebefore3(inputs)
});
export { launchpad_agerestriction_requiresagebefore3 as "launchpad.ageRestriction.requiresAgeBefore" }