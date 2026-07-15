/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Toasts_Lostconn2Inputs */

const en_networkprompts_toasts_lostconn2 = /** @type {(inputs: Networkprompts_Toasts_Lostconn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oops! It seems you’ve lost your connection. The app may not function properly and you will not be able to send boosts.`)
};

const es_networkprompts_toasts_lostconn2 = /** @type {(inputs: Networkprompts_Toasts_Lostconn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Vaya! Parece que perdiste la conexión. La app puede no funcionar correctamente.`)
};

const fr_networkprompts_toasts_lostconn2 = /** @type {(inputs: Networkprompts_Toasts_Lostconn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oups ! Il semble que vous ayez perdu la connexion. L'application pourrait ne pas fonctionner correctement et vous ne pourrez pas envoyer de Boosts.`)
};

const ar_networkprompts_toasts_lostconn2 = /** @type {(inputs: Networkprompts_Toasts_Lostconn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oops! It seems you’ve lost your connection. The app may not function properly and you will not be able to send boosts.`)
};

/**
* | output |
* | --- |
* | "Oops! It seems you’ve lost your connection. The app may not function properly and you will not be able to send boosts." |
*
* @param {Networkprompts_Toasts_Lostconn2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_toasts_lostconn2 = /** @type {((inputs?: Networkprompts_Toasts_Lostconn2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Toasts_Lostconn2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_toasts_lostconn2(inputs)
	if (locale === "es") return es_networkprompts_toasts_lostconn2(inputs)
	if (locale === "fr") return fr_networkprompts_toasts_lostconn2(inputs)
	return ar_networkprompts_toasts_lostconn2(inputs)
});
export { networkprompts_toasts_lostconn2 as "networkPrompts.toasts.lostConn" }