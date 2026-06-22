/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Revokeaccess2Inputs */

const en_datasharing_revokeaccess2 = /** @type {(inputs: Datasharing_Revokeaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revoke Access`)
};

const es_datasharing_revokeaccess2 = /** @type {(inputs: Datasharing_Revokeaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revocar acceso`)
};

const fr_datasharing_revokeaccess2 = /** @type {(inputs: Datasharing_Revokeaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révoquer l'accès`)
};

const ar_datasharing_revokeaccess2 = /** @type {(inputs: Datasharing_Revokeaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء الوصول`)
};

/**
* | output |
* | --- |
* | "Revoke Access" |
*
* @param {Datasharing_Revokeaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_revokeaccess2 = /** @type {((inputs?: Datasharing_Revokeaccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Revokeaccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_revokeaccess2(inputs)
	if (locale === "es") return es_datasharing_revokeaccess2(inputs)
	if (locale === "fr") return fr_datasharing_revokeaccess2(inputs)
	return ar_datasharing_revokeaccess2(inputs)
});
export { datasharing_revokeaccess2 as "dataSharing.revokeAccess" }