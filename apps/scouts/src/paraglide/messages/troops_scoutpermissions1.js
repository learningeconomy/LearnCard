/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Scoutpermissions1Inputs */

const en_troops_scoutpermissions1 = /** @type {(inputs: Troops_Scoutpermissions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout Permissions`)
};

const es_troops_scoutpermissions1 = /** @type {(inputs: Troops_Scoutpermissions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permisos de Scout`)
};

const fr_troops_scoutpermissions1 = /** @type {(inputs: Troops_Scoutpermissions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorisations de Scout`)
};

const ar_troops_scoutpermissions1 = /** @type {(inputs: Troops_Scoutpermissions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صلاحيات الكشاف`)
};

/**
* | output |
* | --- |
* | "Scout Permissions" |
*
* @param {Troops_Scoutpermissions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_scoutpermissions1 = /** @type {((inputs?: Troops_Scoutpermissions1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Scoutpermissions1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_scoutpermissions1(inputs)
	if (locale === "es") return es_troops_scoutpermissions1(inputs)
	if (locale === "fr") return fr_troops_scoutpermissions1(inputs)
	return ar_troops_scoutpermissions1(inputs)
});
export { troops_scoutpermissions1 as "troops.scoutPermissions" }