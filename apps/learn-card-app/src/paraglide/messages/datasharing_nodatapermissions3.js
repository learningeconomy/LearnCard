/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Nodatapermissions3Inputs */

const en_datasharing_nodatapermissions3 = /** @type {(inputs: Datasharing_Nodatapermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No data permissions granted`)
};

const es_datasharing_nodatapermissions3 = /** @type {(inputs: Datasharing_Nodatapermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se han concedido permisos de datos`)
};

const fr_datasharing_nodatapermissions3 = /** @type {(inputs: Datasharing_Nodatapermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune autorisation de données accordée`)
};

const ar_datasharing_nodatapermissions3 = /** @type {(inputs: Datasharing_Nodatapermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم منح أذونات بيانات`)
};

/**
* | output |
* | --- |
* | "No data permissions granted" |
*
* @param {Datasharing_Nodatapermissions3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_nodatapermissions3 = /** @type {((inputs?: Datasharing_Nodatapermissions3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Nodatapermissions3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_nodatapermissions3(inputs)
	if (locale === "es") return es_datasharing_nodatapermissions3(inputs)
	if (locale === "fr") return fr_datasharing_nodatapermissions3(inputs)
	return ar_datasharing_nodatapermissions3(inputs)
});
export { datasharing_nodatapermissions3 as "dataSharing.noDataPermissions" }