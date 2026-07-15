/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Nationaladminpermissions2Inputs */

const en_troops_nationaladminpermissions2 = /** @type {(inputs: Troops_Nationaladminpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`National Admin Permissions`)
};

const es_troops_nationaladminpermissions2 = /** @type {(inputs: Troops_Nationaladminpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permisos de Admin Nacional`)
};

const fr_troops_nationaladminpermissions2 = /** @type {(inputs: Troops_Nationaladminpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorisations d'administrateur national`)
};

const ar_troops_nationaladminpermissions2 = /** @type {(inputs: Troops_Nationaladminpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`National Admin Permissions`)
};

/**
* | output |
* | --- |
* | "National Admin Permissions" |
*
* @param {Troops_Nationaladminpermissions2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_nationaladminpermissions2 = /** @type {((inputs?: Troops_Nationaladminpermissions2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Nationaladminpermissions2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_nationaladminpermissions2(inputs)
	if (locale === "es") return es_troops_nationaladminpermissions2(inputs)
	if (locale === "fr") return fr_troops_nationaladminpermissions2(inputs)
	return ar_troops_nationaladminpermissions2(inputs)
});
export { troops_nationaladminpermissions2 as "troops.nationalAdminPermissions" }