/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Addmessage4Inputs */

const en_boostcms_addmessage4 = /** @type {(inputs: Boostcms_Addmessage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a message...`)
};

const es_boostcms_addmessage4 = /** @type {(inputs: Boostcms_Addmessage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir un mensaje...`)
};

const fr_boostcms_addmessage4 = /** @type {(inputs: Boostcms_Addmessage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un message...`)
};

const ar_boostcms_addmessage4 = /** @type {(inputs: Boostcms_Addmessage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف رسالة...`)
};

/**
* | output |
* | --- |
* | "Add a message..." |
*
* @param {Boostcms_Addmessage4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_addmessage4 = /** @type {((inputs?: Boostcms_Addmessage4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Addmessage4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_addmessage4(inputs)
	if (locale === "es") return es_boostcms_addmessage4(inputs)
	if (locale === "fr") return fr_boostcms_addmessage4(inputs)
	return ar_boostcms_addmessage4(inputs)
});
export { boostcms_addmessage4 as "boostCMS.addMessage" }