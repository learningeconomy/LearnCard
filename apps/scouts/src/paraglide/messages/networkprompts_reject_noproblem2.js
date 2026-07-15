/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Reject_Noproblem2Inputs */

const en_networkprompts_reject_noproblem2 = /** @type {(inputs: Networkprompts_Reject_Noproblem2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Problem!`)
};

const es_networkprompts_reject_noproblem2 = /** @type {(inputs: Networkprompts_Reject_Noproblem2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡No hay problema!`)
};

const fr_networkprompts_reject_noproblem2 = /** @type {(inputs: Networkprompts_Reject_Noproblem2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas de problème !`)
};

const ar_networkprompts_reject_noproblem2 = /** @type {(inputs: Networkprompts_Reject_Noproblem2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Problem!`)
};

/**
* | output |
* | --- |
* | "No Problem!" |
*
* @param {Networkprompts_Reject_Noproblem2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_reject_noproblem2 = /** @type {((inputs?: Networkprompts_Reject_Noproblem2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Reject_Noproblem2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_reject_noproblem2(inputs)
	if (locale === "es") return es_networkprompts_reject_noproblem2(inputs)
	if (locale === "fr") return fr_networkprompts_reject_noproblem2(inputs)
	return ar_networkprompts_reject_noproblem2(inputs)
});
export { networkprompts_reject_noproblem2 as "networkPrompts.reject.noProblem" }