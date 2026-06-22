/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Confirmrevoke2Inputs */

const en_datasharing_confirmrevoke2 = /** @type {(inputs: Datasharing_Confirmrevoke2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes, Revoke Access`)
};

const es_datasharing_confirmrevoke2 = /** @type {(inputs: Datasharing_Confirmrevoke2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sí, revocar acceso`)
};

const fr_datasharing_confirmrevoke2 = /** @type {(inputs: Datasharing_Confirmrevoke2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oui, révoquer l'accès`)
};

const ar_datasharing_confirmrevoke2 = /** @type {(inputs: Datasharing_Confirmrevoke2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نعم، إلغاء الوصول`)
};

/**
* | output |
* | --- |
* | "Yes, Revoke Access" |
*
* @param {Datasharing_Confirmrevoke2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_confirmrevoke2 = /** @type {((inputs?: Datasharing_Confirmrevoke2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Confirmrevoke2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_confirmrevoke2(inputs)
	if (locale === "es") return es_datasharing_confirmrevoke2(inputs)
	if (locale === "fr") return fr_datasharing_confirmrevoke2(inputs)
	return ar_datasharing_confirmrevoke2(inputs)
});
export { datasharing_confirmrevoke2 as "dataSharing.confirmRevoke" }