/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Reject_Stilluse2Inputs */

const en_networkprompts_reject_stilluse2 = /** @type {(inputs: Networkprompts_Reject_Stilluse2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can still use ScoutPass.`)
};

const es_networkprompts_reject_stilluse2 = /** @type {(inputs: Networkprompts_Reject_Stilluse2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún puedes usar ScoutPass.`)
};

const fr_networkprompts_reject_stilluse2 = /** @type {(inputs: Networkprompts_Reject_Stilluse2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous pouvez toujours utiliser ScoutPass.`)
};

const ar_networkprompts_reject_stilluse2 = /** @type {(inputs: Networkprompts_Reject_Stilluse2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can still use ScoutPass.`)
};

/**
* | output |
* | --- |
* | "You can still use ScoutPass." |
*
* @param {Networkprompts_Reject_Stilluse2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_reject_stilluse2 = /** @type {((inputs?: Networkprompts_Reject_Stilluse2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Reject_Stilluse2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_reject_stilluse2(inputs)
	if (locale === "es") return es_networkprompts_reject_stilluse2(inputs)
	if (locale === "fr") return fr_networkprompts_reject_stilluse2(inputs)
	return ar_networkprompts_reject_stilluse2(inputs)
});
export { networkprompts_reject_stilluse2 as "networkPrompts.reject.stillUse" }