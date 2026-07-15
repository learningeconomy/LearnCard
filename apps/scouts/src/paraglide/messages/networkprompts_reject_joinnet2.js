/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Reject_Joinnet2Inputs */

const en_networkprompts_reject_joinnet2 = /** @type {(inputs: Networkprompts_Reject_Joinnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Join ScoutPass Network`)
};

const es_networkprompts_reject_joinnet2 = /** @type {(inputs: Networkprompts_Reject_Joinnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unirse a la Red ScoutPass`)
};

const fr_networkprompts_reject_joinnet2 = /** @type {(inputs: Networkprompts_Reject_Joinnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejoindre le réseau ScoutPass`)
};

const ar_networkprompts_reject_joinnet2 = /** @type {(inputs: Networkprompts_Reject_Joinnet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الانضمام إلى شبكة ScoutPass`)
};

/**
* | output |
* | --- |
* | "Join ScoutPass Network" |
*
* @param {Networkprompts_Reject_Joinnet2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_reject_joinnet2 = /** @type {((inputs?: Networkprompts_Reject_Joinnet2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Reject_Joinnet2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_reject_joinnet2(inputs)
	if (locale === "es") return es_networkprompts_reject_joinnet2(inputs)
	if (locale === "fr") return fr_networkprompts_reject_joinnet2(inputs)
	return ar_networkprompts_reject_joinnet2(inputs)
});
export { networkprompts_reject_joinnet2 as "networkPrompts.reject.joinNet" }