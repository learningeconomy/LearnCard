/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Optout_Limit2Inputs */

const en_networkprompts_optout_limit2 = /** @type {(inputs: Networkprompts_Optout_Limit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You won’t be able to send Boosts or connect with others, but you can still sync credentials. You can join later anytime.`)
};

const es_networkprompts_optout_limit2 = /** @type {(inputs: Networkprompts_Optout_Limit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No podrás enviar Boosts ni conectar con otros, pero puedes sincronizar credenciales. Puedes unirte después.`)
};

const fr_networkprompts_optout_limit2 = /** @type {(inputs: Networkprompts_Optout_Limit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous ne pourrez pas envoyer de Boosts ni vous connecter avec d'autres, mais vous pouvez toujours synchroniser vos justificatifs. Vous pouvez rejoindre plus tard à tout moment.`)
};

const ar_networkprompts_optout_limit2 = /** @type {(inputs: Networkprompts_Optout_Limit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لن تتمكن من إرسال التعزيزات أو التواصل مع الآخرين، لكن لا يزال بإمكانك مزامنة المؤهلات. يمكنك الانضمام لاحقاً في أي وقت.`)
};

/**
* | output |
* | --- |
* | "You won’t be able to send Boosts or connect with others, but you can still sync credentials. You can join later anytime." |
*
* @param {Networkprompts_Optout_Limit2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_optout_limit2 = /** @type {((inputs?: Networkprompts_Optout_Limit2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Optout_Limit2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_optout_limit2(inputs)
	if (locale === "es") return es_networkprompts_optout_limit2(inputs)
	if (locale === "fr") return fr_networkprompts_optout_limit2(inputs)
	return ar_networkprompts_optout_limit2(inputs)
});
export { networkprompts_optout_limit2 as "networkPrompts.optOut.limit" }