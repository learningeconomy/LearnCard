/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Join_Desc1Inputs */

const en_networkprompts_join_desc1 = /** @type {(inputs: Networkprompts_Join_Desc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The ScoutPass Network allows you to exchange credentials and badges with other members.`)
};

const es_networkprompts_join_desc1 = /** @type {(inputs: Networkprompts_Join_Desc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La Red ScoutPass te permite intercambiar credenciales e insignias con otros miembros.`)
};

const fr_networkprompts_join_desc1 = /** @type {(inputs: Networkprompts_Join_Desc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le réseau ScoutPass vous permet d'échanger des justificatifs et des badges avec d'autres membres.`)
};

const ar_networkprompts_join_desc1 = /** @type {(inputs: Networkprompts_Join_Desc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تتيح لك شبكة ScoutPass تبادل المؤهلات والشارات مع الأعضاء الآخرين.`)
};

/**
* | output |
* | --- |
* | "The ScoutPass Network allows you to exchange credentials and badges with other members." |
*
* @param {Networkprompts_Join_Desc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_join_desc1 = /** @type {((inputs?: Networkprompts_Join_Desc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Join_Desc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_join_desc1(inputs)
	if (locale === "es") return es_networkprompts_join_desc1(inputs)
	if (locale === "fr") return fr_networkprompts_join_desc1(inputs)
	return ar_networkprompts_join_desc1(inputs)
});
export { networkprompts_join_desc1 as "networkPrompts.join.desc" }