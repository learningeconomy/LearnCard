/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Settings_Recvreq2Inputs */

const en_networkprompts_settings_recvreq2 = /** @type {(inputs: Networkprompts_Settings_Recvreq2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Receive connection requests.`)
};

const es_networkprompts_settings_recvreq2 = /** @type {(inputs: Networkprompts_Settings_Recvreq2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recibir solicitudes de conexión.`)
};

const fr_networkprompts_settings_recvreq2 = /** @type {(inputs: Networkprompts_Settings_Recvreq2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recevoir des demandes de connexion.`)
};

const ar_networkprompts_settings_recvreq2 = /** @type {(inputs: Networkprompts_Settings_Recvreq2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Receive connection requests.`)
};

/**
* | output |
* | --- |
* | "Receive connection requests." |
*
* @param {Networkprompts_Settings_Recvreq2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_settings_recvreq2 = /** @type {((inputs?: Networkprompts_Settings_Recvreq2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Settings_Recvreq2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_settings_recvreq2(inputs)
	if (locale === "es") return es_networkprompts_settings_recvreq2(inputs)
	if (locale === "fr") return fr_networkprompts_settings_recvreq2(inputs)
	return ar_networkprompts_settings_recvreq2(inputs)
});
export { networkprompts_settings_recvreq2 as "networkPrompts.settings.recvReq" }