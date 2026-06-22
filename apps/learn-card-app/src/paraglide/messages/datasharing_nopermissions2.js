/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Nopermissions2Inputs */

const en_datasharing_nopermissions2 = /** @type {(inputs: Datasharing_Nopermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No permissions`)
};

const es_datasharing_nopermissions2 = /** @type {(inputs: Datasharing_Nopermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin permisos`)
};

const fr_datasharing_nopermissions2 = /** @type {(inputs: Datasharing_Nopermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune autorisation`)
};

const ar_datasharing_nopermissions2 = /** @type {(inputs: Datasharing_Nopermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد أذونات`)
};

/**
* | output |
* | --- |
* | "No permissions" |
*
* @param {Datasharing_Nopermissions2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_nopermissions2 = /** @type {((inputs?: Datasharing_Nopermissions2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Nopermissions2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_nopermissions2(inputs)
	if (locale === "es") return es_datasharing_nopermissions2(inputs)
	if (locale === "fr") return fr_datasharing_nopermissions2(inputs)
	return ar_datasharing_nopermissions2(inputs)
});
export { datasharing_nopermissions2 as "dataSharing.noPermissions" }