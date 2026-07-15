/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Settings_Sendreqdesc3Inputs */

const en_networkprompts_settings_sendreqdesc3 = /** @type {(inputs: Networkprompts_Settings_Sendreqdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass acts as a gateway that sends encrypted connection requests on your behalf.`)
};

const es_networkprompts_settings_sendreqdesc3 = /** @type {(inputs: Networkprompts_Settings_Sendreqdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass actúa como una puerta de enlace que envía solicitudes cifradas en tu nombre.`)
};

const fr_networkprompts_settings_sendreqdesc3 = /** @type {(inputs: Networkprompts_Settings_Sendreqdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass agit comme une passerelle qui envoie des demandes de connexion chiffrées en votre nom.`)
};

const ar_networkprompts_settings_sendreqdesc3 = /** @type {(inputs: Networkprompts_Settings_Sendreqdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يعمل ScoutPass كبوابة ترسل طلبات الاتصال المشفرة نيابة عنك.`)
};

/**
* | output |
* | --- |
* | "ScoutPass acts as a gateway that sends encrypted connection requests on your behalf." |
*
* @param {Networkprompts_Settings_Sendreqdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_settings_sendreqdesc3 = /** @type {((inputs?: Networkprompts_Settings_Sendreqdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Settings_Sendreqdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_settings_sendreqdesc3(inputs)
	if (locale === "es") return es_networkprompts_settings_sendreqdesc3(inputs)
	if (locale === "fr") return fr_networkprompts_settings_sendreqdesc3(inputs)
	return ar_networkprompts_settings_sendreqdesc3(inputs)
});
export { networkprompts_settings_sendreqdesc3 as "networkPrompts.settings.sendReqDesc" }