/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Noreadpermissions3Inputs */

const en_datasharing_noreadpermissions3 = /** @type {(inputs: Datasharing_Noreadpermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No read permissions granted`)
};

const es_datasharing_noreadpermissions3 = /** @type {(inputs: Datasharing_Noreadpermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se han concedido permisos de lectura`)
};

const fr_datasharing_noreadpermissions3 = /** @type {(inputs: Datasharing_Noreadpermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune autorisation de lecture accordée`)
};

const ar_datasharing_noreadpermissions3 = /** @type {(inputs: Datasharing_Noreadpermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم منح أذونات قراءة`)
};

/**
* | output |
* | --- |
* | "No read permissions granted" |
*
* @param {Datasharing_Noreadpermissions3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_noreadpermissions3 = /** @type {((inputs?: Datasharing_Noreadpermissions3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Noreadpermissions3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_noreadpermissions3(inputs)
	if (locale === "es") return es_datasharing_noreadpermissions3(inputs)
	if (locale === "fr") return fr_datasharing_noreadpermissions3(inputs)
	return ar_datasharing_noreadpermissions3(inputs)
});
export { datasharing_noreadpermissions3 as "dataSharing.noReadPermissions" }