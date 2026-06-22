/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Nowritepermissions3Inputs */

const en_datasharing_nowritepermissions3 = /** @type {(inputs: Datasharing_Nowritepermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No write permissions granted`)
};

const es_datasharing_nowritepermissions3 = /** @type {(inputs: Datasharing_Nowritepermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se han concedido permisos de escritura`)
};

const fr_datasharing_nowritepermissions3 = /** @type {(inputs: Datasharing_Nowritepermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune autorisation d'écriture accordée`)
};

const ar_datasharing_nowritepermissions3 = /** @type {(inputs: Datasharing_Nowritepermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم منح أذونات كتابة`)
};

/**
* | output |
* | --- |
* | "No write permissions granted" |
*
* @param {Datasharing_Nowritepermissions3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_nowritepermissions3 = /** @type {((inputs?: Datasharing_Nowritepermissions3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Nowritepermissions3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_nowritepermissions3(inputs)
	if (locale === "es") return es_datasharing_nowritepermissions3(inputs)
	if (locale === "fr") return fr_datasharing_nowritepermissions3(inputs)
	return ar_datasharing_nowritepermissions3(inputs)
});
export { datasharing_nowritepermissions3 as "dataSharing.noWritePermissions" }