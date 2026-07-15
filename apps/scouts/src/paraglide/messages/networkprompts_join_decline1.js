/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Join_Decline1Inputs */

const en_networkprompts_join_decline1 = /** @type {(inputs: Networkprompts_Join_Decline1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Don’t Accept`)
};

const es_networkprompts_join_decline1 = /** @type {(inputs: Networkprompts_Join_Decline1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Aceptar`)
};

const fr_networkprompts_join_decline1 = /** @type {(inputs: Networkprompts_Join_Decline1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ne pas accepter`)
};

const ar_networkprompts_join_decline1 = /** @type {(inputs: Networkprompts_Join_Decline1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا تقبل`)
};

/**
* | output |
* | --- |
* | "Don’t Accept" |
*
* @param {Networkprompts_Join_Decline1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_join_decline1 = /** @type {((inputs?: Networkprompts_Join_Decline1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Join_Decline1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_join_decline1(inputs)
	if (locale === "es") return es_networkprompts_join_decline1(inputs)
	if (locale === "fr") return fr_networkprompts_join_decline1(inputs)
	return ar_networkprompts_join_decline1(inputs)
});
export { networkprompts_join_decline1 as "networkPrompts.join.decline" }