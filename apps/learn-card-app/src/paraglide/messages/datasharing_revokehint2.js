/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Revokehint2Inputs */

const en_datasharing_revokehint2 = /** @type {(inputs: Datasharing_Revokehint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can revoke access at any time by tapping on a service.`)
};

const es_datasharing_revokehint2 = /** @type {(inputs: Datasharing_Revokehint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Puedes revocar el acceso en cualquier momento tocando un servicio.`)
};

const fr_datasharing_revokehint2 = /** @type {(inputs: Datasharing_Revokehint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous pouvez révoquer l'accès à tout moment en appuyant sur un service.`)
};

const ar_datasharing_revokehint2 = /** @type {(inputs: Datasharing_Revokehint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يمكنك إلغاء الوصول في أي وقت بالنقر على خدمة.`)
};

/**
* | output |
* | --- |
* | "You can revoke access at any time by tapping on a service." |
*
* @param {Datasharing_Revokehint2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_revokehint2 = /** @type {((inputs?: Datasharing_Revokehint2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Revokehint2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_revokehint2(inputs)
	if (locale === "es") return es_datasharing_revokehint2(inputs)
	if (locale === "fr") return fr_datasharing_revokehint2(inputs)
	return ar_datasharing_revokehint2(inputs)
});
export { datasharing_revokehint2 as "dataSharing.revokeHint" }