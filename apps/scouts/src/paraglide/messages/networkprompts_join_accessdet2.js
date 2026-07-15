/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Join_Accessdet2Inputs */

const en_networkprompts_join_accessdet2 = /** @type {(inputs: Networkprompts_Join_Accessdet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send and receive connection requests, display your profile photo and name in your connections’ contacts lists.`)
};

const es_networkprompts_join_accessdet2 = /** @type {(inputs: Networkprompts_Join_Accessdet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envía y recibe solicitudes de conexión, muestra tu foto y nombre en las listas de contactos.`)
};

const fr_networkprompts_join_accessdet2 = /** @type {(inputs: Networkprompts_Join_Accessdet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyez et recevez des demandes de connexion, affichez votre photo de profil et votre nom dans les listes de contacts de vos connexions.`)
};

const ar_networkprompts_join_accessdet2 = /** @type {(inputs: Networkprompts_Join_Accessdet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أرسل واستقبل طلبات الاتصال، واعرض صورتك الشخصية واسمك في قوائم جهات اتصال من تتواصل معهم.`)
};

/**
* | output |
* | --- |
* | "Send and receive connection requests, display your profile photo and name in your connections’ contacts lists." |
*
* @param {Networkprompts_Join_Accessdet2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_join_accessdet2 = /** @type {((inputs?: Networkprompts_Join_Accessdet2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Join_Accessdet2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_join_accessdet2(inputs)
	if (locale === "es") return es_networkprompts_join_accessdet2(inputs)
	if (locale === "fr") return fr_networkprompts_join_accessdet2(inputs)
	return ar_networkprompts_join_accessdet2(inputs)
});
export { networkprompts_join_accessdet2 as "networkPrompts.join.accessDet" }