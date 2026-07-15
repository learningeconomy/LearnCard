/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Nationaladminid2Inputs */

const en_troops_nationaladminid2 = /** @type {(inputs: Troops_Nationaladminid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`National Admin ID`)
};

const es_troops_nationaladminid2 = /** @type {(inputs: Troops_Nationaladminid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de Admin Nacional`)
};

const fr_troops_nationaladminid2 = /** @type {(inputs: Troops_Nationaladminid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID Administrateur national`)
};

const ar_troops_nationaladminid2 = /** @type {(inputs: Troops_Nationaladminid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`National Admin ID`)
};

/**
* | output |
* | --- |
* | "National Admin ID" |
*
* @param {Troops_Nationaladminid2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_nationaladminid2 = /** @type {((inputs?: Troops_Nationaladminid2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Nationaladminid2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_nationaladminid2(inputs)
	if (locale === "es") return es_troops_nationaladminid2(inputs)
	if (locale === "fr") return fr_troops_nationaladminid2(inputs)
	return ar_troops_nationaladminid2(inputs)
});
export { troops_nationaladminid2 as "troops.nationalAdminId" }