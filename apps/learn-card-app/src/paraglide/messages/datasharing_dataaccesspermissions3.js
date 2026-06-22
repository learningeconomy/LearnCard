/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Dataaccesspermissions3Inputs */

const en_datasharing_dataaccesspermissions3 = /** @type {(inputs: Datasharing_Dataaccesspermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Data Access Permissions`)
};

const es_datasharing_dataaccesspermissions3 = /** @type {(inputs: Datasharing_Dataaccesspermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permisos de acceso a datos`)
};

const fr_datasharing_dataaccesspermissions3 = /** @type {(inputs: Datasharing_Dataaccesspermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorisations d'accès aux données`)
};

const ar_datasharing_dataaccesspermissions3 = /** @type {(inputs: Datasharing_Dataaccesspermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أذونات الوصول إلى البيانات`)
};

/**
* | output |
* | --- |
* | "Data Access Permissions" |
*
* @param {Datasharing_Dataaccesspermissions3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_dataaccesspermissions3 = /** @type {((inputs?: Datasharing_Dataaccesspermissions3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Dataaccesspermissions3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_dataaccesspermissions3(inputs)
	if (locale === "es") return es_datasharing_dataaccesspermissions3(inputs)
	if (locale === "fr") return fr_datasharing_dataaccesspermissions3(inputs)
	return ar_datasharing_dataaccesspermissions3(inputs)
});
export { datasharing_dataaccesspermissions3 as "dataSharing.dataAccessPermissions" }