/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Globaladminpermissions2Inputs */

const en_troops_globaladminpermissions2 = /** @type {(inputs: Troops_Globaladminpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Global Admin Permissions`)
};

const es_troops_globaladminpermissions2 = /** @type {(inputs: Troops_Globaladminpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permisos de Admin Global`)
};

const fr_troops_globaladminpermissions2 = /** @type {(inputs: Troops_Globaladminpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorisations d'administrateur mondial`)
};

const ar_troops_globaladminpermissions2 = /** @type {(inputs: Troops_Globaladminpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صلاحيات المسؤول العام`)
};

/**
* | output |
* | --- |
* | "Global Admin Permissions" |
*
* @param {Troops_Globaladminpermissions2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_globaladminpermissions2 = /** @type {((inputs?: Troops_Globaladminpermissions2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Globaladminpermissions2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_globaladminpermissions2(inputs)
	if (locale === "es") return es_troops_globaladminpermissions2(inputs)
	if (locale === "fr") return fr_troops_globaladminpermissions2(inputs)
	return ar_troops_globaladminpermissions2(inputs)
});
export { troops_globaladminpermissions2 as "troops.globalAdminPermissions" }