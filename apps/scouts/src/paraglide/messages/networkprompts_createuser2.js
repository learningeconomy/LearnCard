/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Createuser2Inputs */

const en_networkprompts_createuser2 = /** @type {(inputs: Networkprompts_Createuser2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create a new username`)
};

const es_networkprompts_createuser2 = /** @type {(inputs: Networkprompts_Createuser2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear un nuevo nombre de usuario`)
};

const fr_networkprompts_createuser2 = /** @type {(inputs: Networkprompts_Createuser2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un nouveau nom d'utilisateur`)
};

const ar_networkprompts_createuser2 = /** @type {(inputs: Networkprompts_Createuser2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء اسم مستخدم جديد`)
};

/**
* | output |
* | --- |
* | "Create a new username" |
*
* @param {Networkprompts_Createuser2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_createuser2 = /** @type {((inputs?: Networkprompts_Createuser2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Createuser2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_createuser2(inputs)
	if (locale === "es") return es_networkprompts_createuser2(inputs)
	if (locale === "fr") return fr_networkprompts_createuser2(inputs)
	return ar_networkprompts_createuser2(inputs)
});
export { networkprompts_createuser2 as "networkPrompts.createUser" }