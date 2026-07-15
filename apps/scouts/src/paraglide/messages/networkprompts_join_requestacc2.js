/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Join_Requestacc2Inputs */

const en_networkprompts_join_requestacc2 = /** @type {(inputs: Networkprompts_Join_Requestacc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requesting access to:`)
};

const es_networkprompts_join_requestacc2 = /** @type {(inputs: Networkprompts_Join_Requestacc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitando acceso a:`)
};

const fr_networkprompts_join_requestacc2 = /** @type {(inputs: Networkprompts_Join_Requestacc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande d'accès à :`)
};

const ar_networkprompts_join_requestacc2 = /** @type {(inputs: Networkprompts_Join_Requestacc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب الوصول إلى:`)
};

/**
* | output |
* | --- |
* | "Requesting access to:" |
*
* @param {Networkprompts_Join_Requestacc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_join_requestacc2 = /** @type {((inputs?: Networkprompts_Join_Requestacc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Join_Requestacc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_join_requestacc2(inputs)
	if (locale === "es") return es_networkprompts_join_requestacc2(inputs)
	if (locale === "fr") return fr_networkprompts_join_requestacc2(inputs)
	return ar_networkprompts_join_requestacc2(inputs)
});
export { networkprompts_join_requestacc2 as "networkPrompts.join.requestAcc" }