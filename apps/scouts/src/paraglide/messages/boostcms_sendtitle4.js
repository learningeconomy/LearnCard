/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Boostcms_Sendtitle4Inputs */

const en_boostcms_sendtitle4 = /** @type {(inputs: Boostcms_Sendtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Send ${i?.title}`)
};

const es_boostcms_sendtitle4 = /** @type {(inputs: Boostcms_Sendtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Enviar ${i?.title}`)
};

const fr_boostcms_sendtitle4 = /** @type {(inputs: Boostcms_Sendtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Envoyer ${i?.title}`)
};

const ar_boostcms_sendtitle4 = /** @type {(inputs: Boostcms_Sendtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Send ${i?.title}`)
};

/**
* | output |
* | --- |
* | "Send {title}" |
*
* @param {Boostcms_Sendtitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_sendtitle4 = /** @type {((inputs: Boostcms_Sendtitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Sendtitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_sendtitle4(inputs)
	if (locale === "es") return es_boostcms_sendtitle4(inputs)
	if (locale === "fr") return fr_boostcms_sendtitle4(inputs)
	return ar_boostcms_sendtitle4(inputs)
});
export { boostcms_sendtitle4 as "boostCMS.sendTitle" }