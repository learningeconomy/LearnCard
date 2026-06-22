/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Requestingpermissions2Inputs */

const en_consentflow_requestingpermissions2 = /** @type {(inputs: Consentflow_Requestingpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requesting Permissions`)
};

const es_consentflow_requestingpermissions2 = /** @type {(inputs: Consentflow_Requestingpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitando permisos`)
};

const fr_consentflow_requestingpermissions2 = /** @type {(inputs: Consentflow_Requestingpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande de permissions`)
};

const ar_consentflow_requestingpermissions2 = /** @type {(inputs: Consentflow_Requestingpermissions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب الأذونات`)
};

/**
* | output |
* | --- |
* | "Requesting Permissions" |
*
* @param {Consentflow_Requestingpermissions2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_requestingpermissions2 = /** @type {((inputs?: Consentflow_Requestingpermissions2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Requestingpermissions2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_requestingpermissions2(inputs)
	if (locale === "es") return es_consentflow_requestingpermissions2(inputs)
	if (locale === "fr") return fr_consentflow_requestingpermissions2(inputs)
	return ar_consentflow_requestingpermissions2(inputs)
});
export { consentflow_requestingpermissions2 as "consentFlow.requestingPermissions" }