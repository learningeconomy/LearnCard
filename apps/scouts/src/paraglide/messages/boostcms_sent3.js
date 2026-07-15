/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Sent3Inputs */

const en_boostcms_sent3 = /** @type {(inputs: Boostcms_Sent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sent!`)
};

const es_boostcms_sent3 = /** @type {(inputs: Boostcms_Sent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Enviado!`)
};

const fr_boostcms_sent3 = /** @type {(inputs: Boostcms_Sent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyé !`)
};

const ar_boostcms_sent3 = /** @type {(inputs: Boostcms_Sent3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sent!`)
};

/**
* | output |
* | --- |
* | "Sent!" |
*
* @param {Boostcms_Sent3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_sent3 = /** @type {((inputs?: Boostcms_Sent3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Sent3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_sent3(inputs)
	if (locale === "es") return es_boostcms_sent3(inputs)
	if (locale === "fr") return fr_boostcms_sent3(inputs)
	return ar_boostcms_sent3(inputs)
});
export { boostcms_sent3 as "boostCMS.sent" }