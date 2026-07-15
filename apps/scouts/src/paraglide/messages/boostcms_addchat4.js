/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Addchat4Inputs */

const en_boostcms_addchat4 = /** @type {(inputs: Boostcms_Addchat4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Chat`)
};

const es_boostcms_addchat4 = /** @type {(inputs: Boostcms_Addchat4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir Chat`)
};

const fr_boostcms_addchat4 = /** @type {(inputs: Boostcms_Addchat4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un chat`)
};

const ar_boostcms_addchat4 = /** @type {(inputs: Boostcms_Addchat4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Chat`)
};

/**
* | output |
* | --- |
* | "Add Chat" |
*
* @param {Boostcms_Addchat4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_addchat4 = /** @type {((inputs?: Boostcms_Addchat4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Addchat4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_addchat4(inputs)
	if (locale === "es") return es_boostcms_addchat4(inputs)
	if (locale === "fr") return fr_boostcms_addchat4(inputs)
	return ar_boostcms_addchat4(inputs)
});
export { boostcms_addchat4 as "boostCMS.addChat" }