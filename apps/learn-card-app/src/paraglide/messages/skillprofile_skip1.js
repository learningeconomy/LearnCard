/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Skip1Inputs */

const en_skillprofile_skip1 = /** @type {(inputs: Skillprofile_Skip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skip`)
};

const es_skillprofile_skip1 = /** @type {(inputs: Skillprofile_Skip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Omitir`)
};

const fr_skillprofile_skip1 = /** @type {(inputs: Skillprofile_Skip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passer`)
};

const ar_skillprofile_skip1 = /** @type {(inputs: Skillprofile_Skip1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخطّي`)
};

/**
* | output |
* | --- |
* | "Skip" |
*
* @param {Skillprofile_Skip1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_skip1 = /** @type {((inputs?: Skillprofile_Skip1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Skip1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_skip1(inputs)
	if (locale === "es") return es_skillprofile_skip1(inputs)
	if (locale === "fr") return fr_skillprofile_skip1(inputs)
	return ar_skillprofile_skip1(inputs)
});
export { skillprofile_skip1 as "skillProfile.skip" }