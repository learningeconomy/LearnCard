/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Editpermissions2Inputs */

const en_datasharing_editpermissions2 = /** @type {(inputs: Datasharing_Editpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Permissions`)
};

const es_datasharing_editpermissions2 = /** @type {(inputs: Datasharing_Editpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar permisos`)
};

const fr_datasharing_editpermissions2 = /** @type {(inputs: Datasharing_Editpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier les autorisations`)
};

const ar_datasharing_editpermissions2 = /** @type {(inputs: Datasharing_Editpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل الأذونات`)
};

/**
* | output |
* | --- |
* | "Edit Permissions" |
*
* @param {Datasharing_Editpermissions2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_editpermissions2 = /** @type {((inputs?: Datasharing_Editpermissions2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Editpermissions2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_editpermissions2(inputs)
	if (locale === "es") return es_datasharing_editpermissions2(inputs)
	if (locale === "fr") return fr_datasharing_editpermissions2(inputs)
	return ar_datasharing_editpermissions2(inputs)
});
export { datasharing_editpermissions2 as "dataSharing.editPermissions" }