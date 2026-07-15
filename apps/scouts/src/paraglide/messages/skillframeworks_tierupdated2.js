/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Tierupdated2Inputs */

const en_skillframeworks_tierupdated2 = /** @type {(inputs: Skillframeworks_Tierupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} tiers`)
};

const es_skillframeworks_tierupdated2 = /** @type {(inputs: Skillframeworks_Tierupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} niveles`)
};

const fr_skillframeworks_tierupdated2 = /** @type {(inputs: Skillframeworks_Tierupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} niveaux`)
};

const ar_skillframeworks_tierupdated2 = /** @type {(inputs: Skillframeworks_Tierupdated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} مستويات`)
};

/**
* | output |
* | --- |
* | "{count} tiers" |
*
* @param {Skillframeworks_Tierupdated2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_tierupdated2 = /** @type {((inputs?: Skillframeworks_Tierupdated2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Tierupdated2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_tierupdated2(inputs)
	if (locale === "es") return es_skillframeworks_tierupdated2(inputs)
	if (locale === "fr") return fr_skillframeworks_tierupdated2(inputs)
	return ar_skillframeworks_tierupdated2(inputs)
});
export { skillframeworks_tierupdated2 as "skillFrameworks.tierUpdated" }