/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Privacy_Connectionrequests1Inputs */

const en_settings_privacy_connectionrequests1 = /** @type {(inputs: Settings_Privacy_Connectionrequests1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connection requests`)
};

const es_settings_privacy_connectionrequests1 = /** @type {(inputs: Settings_Privacy_Connectionrequests1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitudes de conexión`)
};

const fr_settings_privacy_connectionrequests1 = /** @type {(inputs: Settings_Privacy_Connectionrequests1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demandes de connexion`)
};

const ar_settings_privacy_connectionrequests1 = /** @type {(inputs: Settings_Privacy_Connectionrequests1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلبات الاتصال`)
};

/**
* | output |
* | --- |
* | "Connection requests" |
*
* @param {Settings_Privacy_Connectionrequests1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const settings_privacy_connectionrequests1 = /** @type {((inputs?: Settings_Privacy_Connectionrequests1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Connectionrequests1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_connectionrequests1(inputs)
	if (locale === "es") return es_settings_privacy_connectionrequests1(inputs)
	if (locale === "fr") return fr_settings_privacy_connectionrequests1(inputs)
	return ar_settings_privacy_connectionrequests1(inputs)
});
export { settings_privacy_connectionrequests1 as "settings.privacy.connectionRequests" }