/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Privacy_Connectionrequestsdesc2Inputs */

const en_settings_privacy_connectionrequestsdesc2 = /** @type {(inputs: Settings_Privacy_Connectionrequestsdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Decide who can send you new connection requests.`)
};

const es_settings_privacy_connectionrequestsdesc2 = /** @type {(inputs: Settings_Privacy_Connectionrequestsdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Decide quién puede enviarte nuevas solicitudes de conexión.`)
};

const fr_settings_privacy_connectionrequestsdesc2 = /** @type {(inputs: Settings_Privacy_Connectionrequestsdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Décidez qui peut vous envoyer des demandes de connexion.`)
};

const ar_settings_privacy_connectionrequestsdesc2 = /** @type {(inputs: Settings_Privacy_Connectionrequestsdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدد من يمكنه إرسال طلبات اتصال جديدة إليك.`)
};

/**
* | output |
* | --- |
* | "Decide who can send you new connection requests." |
*
* @param {Settings_Privacy_Connectionrequestsdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_privacy_connectionrequestsdesc2 = /** @type {((inputs?: Settings_Privacy_Connectionrequestsdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Connectionrequestsdesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_connectionrequestsdesc2(inputs)
	if (locale === "es") return es_settings_privacy_connectionrequestsdesc2(inputs)
	if (locale === "fr") return fr_settings_privacy_connectionrequestsdesc2(inputs)
	return ar_settings_privacy_connectionrequestsdesc2(inputs)
});
export { settings_privacy_connectionrequestsdesc2 as "settings.privacy.connectionRequestsDesc" }