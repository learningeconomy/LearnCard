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

const fr_launchpad_agerestriction_requiresagebefore3 = /** @type {(inputs: Launchpad_Agerestriction_Requiresagebefore3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette application exige que les utilisateurs aient `)
};

const ar_launchpad_agerestriction_requiresagebefore3 = /** @type {(inputs: Launchpad_Agerestriction_Requiresagebefore3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتطلب هذا التطبيق أن يكون المستخدمون `)
};

/**
* | output |
* | --- |
* | "This app requires users to be" |
*
* @param {Launchpad_Agerestriction_Requiresagebefore3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_agerestriction_requiresagebefore3 = /** @type {((inputs?: Launchpad_Agerestriction_Requiresagebefore3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Agerestriction_Requiresagebefore3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_agerestriction_requiresagebefore3(inputs)
	if (locale === "es") return es_launchpad_agerestriction_requiresagebefore3(inputs)
	if (locale === "fr") return fr_launchpad_agerestriction_requiresagebefore3(inputs)
	return ar_launchpad_agerestriction_requiresagebefore3(inputs)
});
export { launchpad_agerestriction_requiresagebefore3 as "launchpad.ageRestriction.requiresAgeBefore" }