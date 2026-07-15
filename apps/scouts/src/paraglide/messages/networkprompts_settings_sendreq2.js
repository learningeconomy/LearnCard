/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Settings_Sendreq2Inputs */

const en_networkprompts_settings_sendreq2 = /** @type {(inputs: Networkprompts_Settings_Sendreq2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Connection Requests.`)
};

const es_networkprompts_settings_sendreq2 = /** @type {(inputs: Networkprompts_Settings_Sendreq2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar Solicitudes de Conexión.`)
};

const fr_networkprompts_settings_sendreq2 = /** @type {(inputs: Networkprompts_Settings_Sendreq2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer des demandes de connexion.`)
};

const ar_networkprompts_settings_sendreq2 = /** @type {(inputs: Networkprompts_Settings_Sendreq2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Connection Requests.`)
};

/**
* | output |
* | --- |
* | "Send Connection Requests." |
*
* @param {Networkprompts_Settings_Sendreq2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_settings_sendreq2 = /** @type {((inputs?: Networkprompts_Settings_Sendreq2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Settings_Sendreq2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_settings_sendreq2(inputs)
	if (locale === "es") return es_networkprompts_settings_sendreq2(inputs)
	if (locale === "fr") return fr_networkprompts_settings_sendreq2(inputs)
	return ar_networkprompts_settings_sendreq2(inputs)
});
export { networkprompts_settings_sendreq2 as "networkPrompts.settings.sendReq" }