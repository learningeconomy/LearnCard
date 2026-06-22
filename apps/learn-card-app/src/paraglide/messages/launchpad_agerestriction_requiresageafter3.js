/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Agerestriction_Requiresageafter3Inputs */

const en_launchpad_agerestriction_requiresageafter3 = /** @type {(inputs: Launchpad_Agerestriction_Requiresageafter3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` years old.`)
};

const es_launchpad_agerestriction_requiresageafter3 = /** @type {(inputs: Launchpad_Agerestriction_Requiresageafter3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` años.`)
};

const fr_launchpad_agerestriction_requiresageafter3 = /** @type {(inputs: Launchpad_Agerestriction_Requiresageafter3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` ans.`)
};

const ar_launchpad_agerestriction_requiresageafter3 = /** @type {(inputs: Launchpad_Agerestriction_Requiresageafter3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` سنة.`)
};

/**
* | output |
* | --- |
* | "years old." |
*
* @param {Launchpad_Agerestriction_Requiresageafter3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_agerestriction_requiresageafter3 = /** @type {((inputs?: Launchpad_Agerestriction_Requiresageafter3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Agerestriction_Requiresageafter3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_agerestriction_requiresageafter3(inputs)
	if (locale === "es") return es_launchpad_agerestriction_requiresageafter3(inputs)
	if (locale === "fr") return fr_launchpad_agerestriction_requiresageafter3(inputs)
	return ar_launchpad_agerestriction_requiresageafter3(inputs)
});
export { launchpad_agerestriction_requiresageafter3 as "launchpad.ageRestriction.requiresAgeAfter" }