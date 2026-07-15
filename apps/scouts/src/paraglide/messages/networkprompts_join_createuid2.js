/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Join_Createuid2Inputs */

const en_networkprompts_join_createuid2 = /** @type {(inputs: Networkprompts_Join_Createuid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Your User ID`)
};

const es_networkprompts_join_createuid2 = /** @type {(inputs: Networkprompts_Join_Createuid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea Tu ID de Usuario`)
};

const fr_networkprompts_join_createuid2 = /** @type {(inputs: Networkprompts_Join_Createuid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez votre identifiant utilisateur`)
};

const ar_networkprompts_join_createuid2 = /** @type {(inputs: Networkprompts_Join_Createuid2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء معرف المستخدم الخاص بك`)
};

/**
* | output |
* | --- |
* | "Create Your User ID" |
*
* @param {Networkprompts_Join_Createuid2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_join_createuid2 = /** @type {((inputs?: Networkprompts_Join_Createuid2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Join_Createuid2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_join_createuid2(inputs)
	if (locale === "es") return es_networkprompts_join_createuid2(inputs)
	if (locale === "fr") return fr_networkprompts_join_createuid2(inputs)
	return ar_networkprompts_join_createuid2(inputs)
});
export { networkprompts_join_createuid2 as "networkPrompts.join.createUid" }