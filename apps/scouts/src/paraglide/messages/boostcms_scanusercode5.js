/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Scanusercode5Inputs */

const en_boostcms_scanusercode5 = /** @type {(inputs: Boostcms_Scanusercode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan User Code`)
};

const es_boostcms_scanusercode5 = /** @type {(inputs: Boostcms_Scanusercode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanear Código de Usuario`)
};

const fr_boostcms_scanusercode5 = /** @type {(inputs: Boostcms_Scanusercode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scanner le code utilisateur`)
};

const ar_boostcms_scanusercode5 = /** @type {(inputs: Boostcms_Scanusercode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسح رمز المستخدم`)
};

/**
* | output |
* | --- |
* | "Scan User Code" |
*
* @param {Boostcms_Scanusercode5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_scanusercode5 = /** @type {((inputs?: Boostcms_Scanusercode5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Scanusercode5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_scanusercode5(inputs)
	if (locale === "es") return es_boostcms_scanusercode5(inputs)
	if (locale === "fr") return fr_boostcms_scanusercode5(inputs)
	return ar_boostcms_scanusercode5(inputs)
});
export { boostcms_scanusercode5 as "boostCMS.scanUserCode" }