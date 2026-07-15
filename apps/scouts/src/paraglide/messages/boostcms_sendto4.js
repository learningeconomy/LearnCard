/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Sendto4Inputs */

const en_boostcms_sendto4 = /** @type {(inputs: Boostcms_Sendto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send To`)
};

const es_boostcms_sendto4 = /** @type {(inputs: Boostcms_Sendto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar A`)
};

const fr_boostcms_sendto4 = /** @type {(inputs: Boostcms_Sendto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer à`)
};

const ar_boostcms_sendto4 = /** @type {(inputs: Boostcms_Sendto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send To`)
};

/**
* | output |
* | --- |
* | "Send To" |
*
* @param {Boostcms_Sendto4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_sendto4 = /** @type {((inputs?: Boostcms_Sendto4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Sendto4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_sendto4(inputs)
	if (locale === "es") return es_boostcms_sendto4(inputs)
	if (locale === "fr") return fr_boostcms_sendto4(inputs)
	return ar_boostcms_sendto4(inputs)
});
export { boostcms_sendto4 as "boostCMS.sendTo" }