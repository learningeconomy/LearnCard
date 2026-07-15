/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Optout_Joinlater3Inputs */

const en_networkprompts_optout_joinlater3 = /** @type {(inputs: Networkprompts_Optout_Joinlater3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can still use ScoutPass without joining the network.`)
};

const es_networkprompts_optout_joinlater3 = /** @type {(inputs: Networkprompts_Optout_Joinlater3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún puedes usar ScoutPass sin unirte a la red.`)
};

const fr_networkprompts_optout_joinlater3 = /** @type {(inputs: Networkprompts_Optout_Joinlater3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous pouvez toujours utiliser ScoutPass sans rejoindre le réseau.`)
};

const ar_networkprompts_optout_joinlater3 = /** @type {(inputs: Networkprompts_Optout_Joinlater3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يزال بإمكانك استخدام ScoutPass دون الانضمام إلى الشبكة.`)
};

/**
* | output |
* | --- |
* | "You can still use ScoutPass without joining the network." |
*
* @param {Networkprompts_Optout_Joinlater3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_optout_joinlater3 = /** @type {((inputs?: Networkprompts_Optout_Joinlater3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Optout_Joinlater3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_optout_joinlater3(inputs)
	if (locale === "es") return es_networkprompts_optout_joinlater3(inputs)
	if (locale === "fr") return fr_networkprompts_optout_joinlater3(inputs)
	return ar_networkprompts_optout_joinlater3(inputs)
});
export { networkprompts_optout_joinlater3 as "networkPrompts.optOut.joinLater" }