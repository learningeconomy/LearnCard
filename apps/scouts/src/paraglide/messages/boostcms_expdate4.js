/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Expdate4Inputs */

const en_boostcms_expdate4 = /** @type {(inputs: Boostcms_Expdate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiration Date`)
};

const es_boostcms_expdate4 = /** @type {(inputs: Boostcms_Expdate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de Expiración`)
};

const fr_boostcms_expdate4 = /** @type {(inputs: Boostcms_Expdate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date d'expiration`)
};

const ar_boostcms_expdate4 = /** @type {(inputs: Boostcms_Expdate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiration Date`)
};

/**
* | output |
* | --- |
* | "Expiration Date" |
*
* @param {Boostcms_Expdate4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_expdate4 = /** @type {((inputs?: Boostcms_Expdate4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Expdate4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_expdate4(inputs)
	if (locale === "es") return es_boostcms_expdate4(inputs)
	if (locale === "fr") return fr_boostcms_expdate4(inputs)
	return ar_boostcms_expdate4(inputs)
});
export { boostcms_expdate4 as "boostCMS.expDate" }