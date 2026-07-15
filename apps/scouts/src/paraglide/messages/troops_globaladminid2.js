/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Globaladminid2Inputs */

const en_troops_globaladminid2 = /** @type {(inputs: Troops_Globaladminid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Global Admin ID`)
};

const es_troops_globaladminid2 = /** @type {(inputs: Troops_Globaladminid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de Admin Global`)
};

const fr_troops_globaladminid2 = /** @type {(inputs: Troops_Globaladminid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID Administrateur mondial`)
};

const ar_troops_globaladminid2 = /** @type {(inputs: Troops_Globaladminid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف المسؤول العام`)
};

/**
* | output |
* | --- |
* | "Global Admin ID" |
*
* @param {Troops_Globaladminid2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_globaladminid2 = /** @type {((inputs?: Troops_Globaladminid2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Globaladminid2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_globaladminid2(inputs)
	if (locale === "es") return es_troops_globaladminid2(inputs)
	if (locale === "fr") return fr_troops_globaladminid2(inputs)
	return ar_troops_globaladminid2(inputs)
});
export { troops_globaladminid2 as "troops.globalAdminId" }