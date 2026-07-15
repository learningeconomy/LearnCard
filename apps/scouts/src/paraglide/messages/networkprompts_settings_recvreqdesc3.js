/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Settings_Recvreqdesc3Inputs */

const en_networkprompts_settings_recvreqdesc3 = /** @type {(inputs: Networkprompts_Settings_Recvreqdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass acts as a gateway that receives encrypted connection requests on your behalf.`)
};

const es_networkprompts_settings_recvreqdesc3 = /** @type {(inputs: Networkprompts_Settings_Recvreqdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass actúa como una puerta de enlace que recibe solicitudes cifradas en tu nombre.`)
};

const fr_networkprompts_settings_recvreqdesc3 = /** @type {(inputs: Networkprompts_Settings_Recvreqdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass agit comme une passerelle qui reçoit des demandes de connexion chiffrées en votre nom.`)
};

const ar_networkprompts_settings_recvreqdesc3 = /** @type {(inputs: Networkprompts_Settings_Recvreqdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ScoutPass acts as a gateway that receives encrypted connection requests on your behalf.`)
};

/**
* | output |
* | --- |
* | "ScoutPass acts as a gateway that receives encrypted connection requests on your behalf." |
*
* @param {Networkprompts_Settings_Recvreqdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_settings_recvreqdesc3 = /** @type {((inputs?: Networkprompts_Settings_Recvreqdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Settings_Recvreqdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_settings_recvreqdesc3(inputs)
	if (locale === "es") return es_networkprompts_settings_recvreqdesc3(inputs)
	if (locale === "fr") return fr_networkprompts_settings_recvreqdesc3(inputs)
	return ar_networkprompts_settings_recvreqdesc3(inputs)
});
export { networkprompts_settings_recvreqdesc3 as "networkPrompts.settings.recvReqDesc" }