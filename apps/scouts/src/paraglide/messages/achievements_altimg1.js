/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Achievements_Altimg1Inputs */

const en_achievements_altimg1 = /** @type {(inputs: Achievements_Altimg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Achievements`)
};

const es_achievements_altimg1 = /** @type {(inputs: Achievements_Altimg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logros`)
};

const fr_achievements_altimg1 = /** @type {(inputs: Achievements_Altimg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réalisations`)
};

const ar_achievements_altimg1 = /** @type {(inputs: Achievements_Altimg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإنجازات`)
};

/**
* | output |
* | --- |
* | "Achievements" |
*
* @param {Achievements_Altimg1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const achievements_altimg1 = /** @type {((inputs?: Achievements_Altimg1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Achievements_Altimg1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_achievements_altimg1(inputs)
	if (locale === "es") return es_achievements_altimg1(inputs)
	if (locale === "fr") return fr_achievements_altimg1(inputs)
	return ar_achievements_altimg1(inputs)
});
export { achievements_altimg1 as "achievements.altImg" }